declare module "react-pageflip" {
  import { ForwardRefExoticComponent, RefAttributes, ReactNode } from "react";

  interface FlipEvent {
    data: number;
  }

  interface FlipBookProps {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    className?: string;
    onFlip?: (event: FlipEvent) => void;
    children: ReactNode;
  }

  const HTMLFlipBook: ForwardRefExoticComponent<
    FlipBookProps & RefAttributes<{ pageFlip: () => {
      flipNext: () => void;
      flipPrev: () => void;
      getCurrentPageIndex: () => number;
    } }>
  >;

  export default HTMLFlipBook;
}
