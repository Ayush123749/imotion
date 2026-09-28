 Improve my existing iMotion project. First inspect the current HTML, CSS, and JavaScript, then make changes that fit its existing vanilla web stack.

Goal:
Build a clean, professional emotion-estimation web app with:
- Live facial-expression analysis from the camera.
- Optional voice-tone analysis from the microphone, with explicit permission.
- Text-based emotion estimation from a user-entered sentence.
- A clear, attractive brain-and-robot brand mark.

Requirements:
- Do not show voice or combined results unless those analyses are implemented and returning real results.
- Make every visible setting functional, or remove it.
- Check that required face-model files and any backend endpoints exist. If a dependency is missing, show a useful error and document how to configure it; do not fabricate results.
- Explain that facial and vocal cues estimate expression or tone, not a person’s actual internal emotion. Show uncertainty honestly.
- Process media locally by default where feasible. Do not record or store audio/video without clear consent; provide a reliable stop control that releases camera and microphone.
- Make text-history storage understandable and removable.
- Keep the page responsive, keyboard-accessible, and usable when permissions are denied or devices are unavailable.
- Preserve the current project structure unless a change is necessary.
- After implementation, verify the main flows: text analysis, camera permission and stop, missing model/backend behavior, and mobile layout. Summarize changes and any remaining setup requirements.