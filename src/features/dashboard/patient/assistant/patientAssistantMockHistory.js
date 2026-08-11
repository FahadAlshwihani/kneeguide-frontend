/**
 * Static conversation-history FIXTURES — product demos of KneeGuide
 * Assistant's intended FUTURE capability (report intelligence, exercise-
 * session analysis, mock appointment booking), not evidence the current
 * live assistant already does any of this. `isMockHistory: true` on every
 * conversation here is the architectural marker: PatientHomeAssistant.jsx
 * only ever SEEDS a conversation's `messages` from this file once, at
 * creation — these objects are never passed to `matchAssistantAction`,
 * never passed to an action's `execute`, and never regenerated. Any NEW
 * message a user later types into one of these conversations goes through
 * the exact same live, honest, deterministic pipeline as a brand-new chat.
 *
 * Every message is seeded with `pending: false` — see
 * PatientHomeAssistant.jsx's ConversationTurn: `pending` is the sole
 * Typewriter gate, so historical assistant turns render as static text
 * immediately and never replay the type-on animation, exactly like
 * content that was already there when the conversation was opened (not
 * content that just arrived).
 *
 * `language` is fixed per conversation (both fixtures are cast in casual
 * Gulf/Saudi-leaning Arabic, per the task's own direction) — this is
 * intentionally independent of the active UI language; opening an Arabic
 * historical conversation while the UI is set to English does not change
 * anything about the UI, only the conversation content stays Arabic (see
 * PatientHomeAssistant.jsx's per-message `dir="auto"` handling).
 *
 * MOCK DATA CONSISTENCY — every number an assistant turn states below was
 * chosen once and is never contradicted by a later turn in the same
 * conversation:
 *   Conversation 1 (report + appointment): previous report ROM 108°, pain
 *   avg 4.2/10, adherence 75%; latest report ROM 118° (+10°), pain avg
 *   3.4/10 (-0.8), adherence 82% (+7%).
 *   Conversation 2 (exercises + pain): today 3/4 exercises completed
 *   (Quad Sets 3x12, Straight Leg Raises 3x10, Heel Slides 3x15); knee
 *   flexion 104° (previous session) -> 112° (today); 7-day pain log
 *   5, 4, 4, 3, 3, 4, and 5/10 measured after today's session.
 */

const staticMessage = (id, role, content, extra = {}) => ({
  id,
  role,
  content,
  pending: false,
  ...extra,
});

const REPORT_APPOINTMENT_CONVERSATION = {
  id: "mock-report-appointment",
  title: "تقريري الأخير والموعد",
  language: "ar",
  isMockHistory: true,
  status: "historical",
  createdAt: "2026-08-06T10:15:00.000Z",
  updatedAt: "2026-08-06T10:24:00.000Z",
  messages: [
    staticMessage(
      "mock-ra-1",
      "user",
      "وش وضع تقريري الأخير؟ أحس الركبة أحسن بس للحين الحركة مو كاملة"
    ),
    staticMessage(
      "mock-ra-2",
      "assistant",
      "تقريرك الأخير بتاريخ 6 أغسطس يبين تحسن واضح: مدى حركة الركبة وصل لـ118°، ومتوسط الألم نزل لـ3.4 من 10، والتزامك بالتمارين هالأسبوع 82%. أنت فعلاً في مسار جيد — طبيعي إن الحركة الكاملة تحتاج وقت أطول شوي بعد."
    ),
    staticMessage("mock-ra-3", "user", "طيب كيف مقارنة بالتقرير اللي قبله؟"),
    staticMessage(
      "mock-ra-4",
      "assistant",
      "بالمقارنة مع تقريرك السابق: مدى الحركة كان 108° وصار 118°، يعني زيادة 10 درجات. متوسط الألم كان 4.2 ونزل لـ3.4. والتزامك بالتمارين كان 75% وارتفع لـ82%. تحسن ملحوظ على كل الجوانب."
    ),
    staticMessage("mock-ra-5", "user", "بس آخر يومين حاسس الألم زاد شوي، هالشي طبيعي؟"),
    staticMessage(
      "mock-ra-6",
      "assistant",
      "زيادة بسيطة بالألم بعد فترة تحسن ممكن تصير أحيانًا، خصوصًا إذا زاد النشاط أو التمارين شوي عن المعتاد. المهم تراقبها الأيام الجاية — إذا استمر الألم يزيد أو صار فيه تورم واضح، الأفضل نتواصل مع الدكتورة."
    ),
    staticMessage("mock-ra-7", "user", "تتوقعين أحتاج أكلم الدكتورة؟"),
    staticMessage(
      "mock-ra-8",
      "assistant",
      "إذا تحب تكون على الأمان، أقدر أحجز لك أقرب موعد متابعة مع د. سارة أحمد عشان تتأكدون كل شي تمام. تحب أسوي ذلك؟"
    ),
    staticMessage("mock-ra-9", "user", "ايه احجز لي أقرب موعد"),
    staticMessage(
      "mock-ra-10",
      "assistant",
      "تم، حجزت لك موعد متابعة مع د. سارة أحمد يوم الأربعاء القادم الساعة 11:00 صباحًا في عيادة KneeGuide - الغرفة 4. بتوصلك رسالة تذكير قبل الموعد بيوم."
    ),
    staticMessage("mock-ra-11", "user", "تمام، يعطيك العافية"),
    staticMessage(
      "mock-ra-12",
      "assistant",
      "الله يعافيك. اعتني بنفسك، وإذا حسيت أي تغيير ثاني بالألم قبل الموعد، راسليني في أي وقت."
    ),
  ],
};

const EXERCISE_PAIN_CONVERSATION = {
  id: "mock-exercise-pain",
  title: "ألم الركبة بعد التمارين",
  language: "ar",
  isMockHistory: true,
  status: "historical",
  createdAt: "2026-08-09T18:40:00.000Z",
  updatedAt: "2026-08-09T18:49:00.000Z",
  messages: [
    staticMessage("mock-ep-1", "user", "ياخي اليوم الألم مو طبيعي بعد التمارين"),
    staticMessage(
      "mock-ep-2",
      "assistant",
      "شفت تمارين اليوم — كملت 3 من أصل 4 (Quad Sets 3×12، رفع الساق المستقيمة 3×10، وHeel Slides 3×15). قياس مدى حركة الركبة اليوم وصل 112° مقارنة بـ104° بالجلسة اللي قبلها، يعني في تحسن فعلي بالمرونة. بعد التمرين سجلت مستوى الألم عندك 5 من 10."
    ),
    staticMessage("mock-ep-3", "user", "هو كان أخف الأيام اللي فاتت"),
    staticMessage(
      "mock-ep-4",
      "assistant",
      "صح، آخر 7 أيام كان الألم عندك حوالي 5، 4، 4، 3، 3، 4، واليوم بعد التمرين رجع لـ5. يعني ارتفاع بسيط مقارنة بمعظم الأسبوع — مو شي غريب بعد جلسة أثقل شوي بالحركة، بس خلنا نراقبه سوا."
    ),
    staticMessage("mock-ep-5", "user", "يعني عادي ولا لازم أوقف التمارين؟"),
    staticMessage(
      "mock-ep-6",
      "assistant",
      "غالبًا هذا النوع من الألم بعد مجهود أكبر شي طبيعي ومؤقت. أنصحك تاخذ قسط راحة اليوم، تحط كمادة باردة على الركبة 15-20 دقيقة، وما تكمل أي حركة تسبب لك ألم واضح. إذا الألم يخف خلال يوم أو يومين فهذا مطمئن."
    ),
    staticMessage("mock-ep-7", "user", "ومتى لازم أتواصل مع الدكتورة؟"),
    staticMessage(
      "mock-ep-8",
      "assistant",
      "إذا استمر الألم يزيد بدل ما يخف، أو صار فيه تورم واضح، أو حسيت عدم ثبات بالركبة، فالأفضل تتواصل مع د. سارة بأقرب وقت. غير كذا، راقب الوضع وسجّل ألمك يوميًا عشان نتابعه مع بعض."
    ),
    staticMessage("mock-ep-9", "user", "تمام إن شاء الله بس أرتاح اليوم"),
    staticMessage(
      "mock-ep-10",
      "assistant",
      "فكرة ممتازة. خذ راحتك اليوم، وإذا حسيت تحسن بكرة نكمل البرنامج بشكل طبيعي. اعتني بنفسك."
    ),
  ],
};

/**
 * Returns a FRESH, deep-cloned array every call — callers (the assistant's
 * own conversation state) own and may append to their copy freely without
 * ever mutating this module's shared literals.
 */
export const createMockHistoryConversations = () =>
  [REPORT_APPOINTMENT_CONVERSATION, EXERCISE_PAIN_CONVERSATION].map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({ ...message })),
  }));
