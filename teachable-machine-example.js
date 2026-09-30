/*
  OPTIONAL NEXT STEP

  The device page already exposes:

      window.recordSighting("Kangaroo");

  When a Teachable Machine model returns a prediction, call that function.

  Example conceptual logic:

      if (prediction.className === "Kangaroo" && prediction.probability > 0.85) {
          window.recordSighting("Kangaroo");
      }

  The exact model-loading code depends on whether you use a Teachable Machine
  image model, webcam model, or another model type.
*/
