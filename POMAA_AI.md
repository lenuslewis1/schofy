# Pomaa AI workflows

Open Ask Pomaa → AI workflows & resources. The workflow buttons prepare an editable question; send it to start the conversation.

GPT-6 Luna powers school questions, fee follow-ups, report comments, progress insights, lesson planning, quizzes and marking guides, parent communication and translation, timetable proposals, policy answers and daily briefings. Existing universal record imports also default to Luna. Audio uses `gpt-4o-mini-transcribe` for transcription, then Luna for the task. The existing key stays in `.env.local` and is used only by the server.

Review generated messages before saving to Communications. Delivery providers remain unconnected. Review generated teaching materials, comments and proposed schedules before saving to the AI resource library; these do not overwrite grades or timetable entries. Resources can be downloaded as text.

The school owner can upload policy or curriculum documents, review the extracted text, and save up to six sections of 6,000 characters. Choose Staff or Everyone visibility. Answers are instructed to cite document titles and sections. Sources are shared with OpenAI when asking questions; sensitive contact and wellbeing notes remain excluded from the standard school context.

Voice instructions support a one-minute microphone recording or an uploaded audio file, up to 5 MB. Review the transcript in the question box before sending. Microphone use requires browser permission and HTTPS or localhost. Physical microphone verification remains outstanding.

School-data context contains aggregate totals and up to 40 examples per section. Pomaa must disclose this limit when completeness matters. Progress comparisons need comparable, dated assessments; timetable clashes need meaningful time ranges. Suggestions are AI outputs for human review, not deterministic scheduling or automatic interventions.

Production requests continue to authenticate the school owner and load the owner’s saved workspace on the server. Other roles currently exist as local previews; production multi-user staff/parent accounts are not added by this change. Saved resources and policies use the existing workspace save mechanism. New remote save/reload flows were not exercised against a signed-in production school.

Verification: 28 automated tests; production build; live Luna lesson and quiz generation; browser resource review/save/reload; live text-policy extraction and save/reload; parent-preview restrictions; mobile overflow and visual checks. Audio endpoint tests use mocked transcription; physical audio capture remains unverified.
