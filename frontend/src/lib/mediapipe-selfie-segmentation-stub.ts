// @tensorflow-models/body-segmentation statically imports SelfieSegmentation from
// @mediapipe/selfie_segmentation for its 'mediapipe' runtime option — even though we
// only ever use the 'tfjs' runtime. That package ships a UMD bundle whose named
// export is assigned dynamically, which Vite cannot statically resolve
// ("does not provide an export named 'SelfieSegmentation'"). Since the real export
// is never called from this app, this stub (aliased in vite.config.ts) satisfies the
// import without pulling in the real (broken-for-Vite) package.
export class SelfieSegmentation {
  constructor() {
    throw new Error(
      "SelfieSegmentation (mediapipe runtime) stub was invoked — this app only uses the 'tfjs' runtime.",
    );
  }
}

export const VERSION = "stub";
