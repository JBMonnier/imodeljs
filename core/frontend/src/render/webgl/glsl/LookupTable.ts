/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
/** @module WebGL */

import { ShaderBuilder, VertexShaderBuilder, VariableType } from "../ShaderBuilder";

const computeLUTCoords = `
vec2 computeLUTCoords(float index, vec2 dimensions, vec2 center, float mult) {
  float baseIndex = index*mult;

  // Fix precision issues wherein mod(x,y) => y instead of 0 when x is multiple of y...
  float epsilon = 0.5 / dimensions.x;
  float yId = floor(baseIndex / dimensions.x + epsilon);
  float xId = baseIndex - dimensions.x * yId; // replaces mod()...

  return center + vec2(xId/dimensions.x, yId/dimensions.y);
}
`;

const computeCoordsTemplate = `
vec2 compute_{LUTNAME}_coords(float index) {
  return computeLUTCoords(index, u_{LUTNAME}Params.xy, g_{LUTNAME}_center, {MULT});
}
`;

const initializerTemplate = `
  {LUTSTEPX} = 1.0 / {LUTPARAMS}.x;
  {LUTSTEPY} = 1.0 / {LUTPARAMS}.y;
  {LUTCENTER} = vec2(0.5*{LUTSTEPX}, 0.5*{LUTSTEPY});
`;

export function addLookupTable(sb: ShaderBuilder, lutName: string, mult: string = "1.0") {
  sb.addFunction(computeLUTCoords);

  if (sb instanceof VertexShaderBuilder) {
    const lutStepX = "g_" + lutName + "_stepX";
    const lutStepY = "g_" + lutName + "_stepY";
    const lutCenter = "g_" + lutName + "_center";
    const lutParams = "u_" + lutName + "Params";

    sb.addGlobal(lutStepX, VariableType.Float);
    sb.addGlobal(lutStepY, VariableType.Float);
    sb.addGlobal(lutCenter, VariableType.Vec2);

    let initializerSpecific = initializerTemplate;
    initializerSpecific = initializerSpecific.replace(/{LUTSTEPX}/g, lutStepX);
    initializerSpecific = initializerSpecific.replace(/{LUTSTEPY}/g, lutStepY);
    initializerSpecific = initializerSpecific.replace(/{LUTCENTER}/g, lutCenter);
    initializerSpecific = initializerSpecific.replace(/{LUTPARAMS}/g, lutParams);
    sb.addInitializer(initializerSpecific);

    let computeCoordsSpecific = computeCoordsTemplate;
    computeCoordsSpecific = computeCoordsSpecific.replace(/{LUTNAME}/g, lutName);
    computeCoordsSpecific = computeCoordsSpecific.replace(/{MULT}/g, mult);
    sb.addFunction(computeCoordsSpecific);
  }
}