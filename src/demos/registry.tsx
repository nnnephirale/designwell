import type { ComponentType } from "react";
import { TextWrapDemo, FontSmoothingDemo, TabularNumsDemo } from "./typography";
import { IconSwapDemo, InterruptibleDemo, StaggerDemo, ExitDemo } from "./motion";
import {
  ConcentricRadiusDemo,
  OpticalDemo,
  ShadowsDemo,
  ImageOutlineDemo,
} from "./depthlayout";
import { BeforeAfterDemo } from "./beforeafter";

/** built-in live reproductions; a demo block with demoId renders one of these */
export const DEMO_REGISTRY: Record<string, { label: string; Component: ComponentType }> = {
  "text-wrap": { label: "Text wrapping", Component: TextWrapDemo },
  "font-smoothing": { label: "Font smoothing", Component: FontSmoothingDemo },
  "tabular-nums": { label: "Tabular numbers", Component: TabularNumsDemo },
  "icon-swap": { label: "Icon swap", Component: IconSwapDemo },
  interruptible: { label: "Interruptible animations", Component: InterruptibleDemo },
  stagger: { label: "Staggered entrance", Component: StaggerDemo },
  exit: { label: "Subtle exits", Component: ExitDemo },
  "concentric-radius": { label: "Concentric radius", Component: ConcentricRadiusDemo },
  optical: { label: "Optical alignment", Component: OpticalDemo },
  shadows: { label: "Shadows vs borders", Component: ShadowsDemo },
  "image-outline": { label: "Image outline", Component: ImageOutlineDemo },
  "before-after": { label: "Before & after", Component: BeforeAfterDemo },
};
