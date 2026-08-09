// Bilingual string dictionary (AR/EN). Keep keys flat and descriptive.
export const STRINGS = {
  brand_name: { en: 'Smart Power', ar: 'سمارت باور' },
  brand_tagline: {
    en: 'Mobile Van Service Simulator',
    ar: 'محاكي خدمة الفان المتنقلة',
  },
  brand_sub: {
    en: 'Train like the crew. Beat the 85% Smart Power standard.',
    ar: 'اتدرب زي الفريق. اكسر معيار سمارت باور 85%.',
  },
  lang_toggle: { en: 'العربية', ar: 'English' },

  menu_play: { en: 'Play', ar: 'ابدأ' },
  menu_locked: { en: 'Coming Soon', ar: 'قريبًا' },
  menu_controls_hint: {
    en: 'WASD to move · Mouse to look · E to interact · Esc to pause',
    ar: 'WASD للحركة · الماوس للنظر · E للتفاعل · Esc لإيقاف مؤقت',
  },
  menu_target_score: { en: 'Target score: 85%', ar: 'الهدف: 85%' },

  scenario_exterior_title: { en: 'Exterior Wash', ar: 'الغسيل الخارجي' },
  scenario_exterior_desc: {
    en: 'Pre-rinse, foam, and dry the body and wheels — with the right towel, every time.',
    ar: 'اشطف، فوّم، وجفف البودي والجنوط — بالفوطة الصح في كل مرة.',
  },
  scenario_interior_title: { en: 'Interior Detail', ar: 'التنظيف الداخلي' },
  scenario_interior_desc: {
    en: 'Mats first, always. Then vacuum, dashboard, and streak-free glass.',
    ar: 'الدواسات أولًا، دايمًا. بعد كده شفط، دشبورد، وزجاج بدون خطوط.',
  },
  scenario_oil_title: { en: 'Oil Change', ar: 'تغيير الزيت' },
  scenario_oil_desc: {
    en: 'Fixed Right First Time. Any leak is a critical failure.',
    ar: 'الصح من أول مرة. أي تسريب يعتبر فشل حرج.',
  },
  scenario_full_title: { en: 'Full Service Journey', ar: 'رحلة الخدمة الكاملة' },
  scenario_full_desc: {
    en: 'Arrival to handover, all 3 crew roles — coming soon.',
    ar: 'من الوصول للتسليم، بكل أدوار الفريق الثلاثة — قريبًا.',
  },

  hud_time_left: { en: 'Time', ar: 'الوقت' },
  hud_tasks: { en: 'Tasks', ar: 'المهام' },
  hud_score_live: { en: 'Live Score', ar: 'النتيجة الحالية' },
  hud_held: { en: 'Holding', ar: 'ماسك' },
  hud_nothing_held: { en: 'Nothing', ar: 'مفيش حاجة' },
  hud_paused: { en: 'Paused', ar: 'إيقاف مؤقت' },
  hud_resume: { en: 'Click canvas to resume', ar: 'اضغط على الشاشة للاستمرار' },
  hud_menu_btn: { en: 'Back to Menu', ar: 'رجوع للقائمة' },

  prompt_interact: { en: 'Press E', ar: 'اضغط E' },
  prompt_pick_up: { en: 'Press E to pick up', ar: 'اضغط E عشان تاخد' },
  prompt_use: { en: 'Press E to use', ar: 'اضغط E عشان تستخدم' },
  prompt_toggle: { en: 'Press E to toggle', ar: 'اضغط E عشان تشغل/تقفل' },
  prompt_drop: { en: 'Press Q to put down', ar: 'اضغط Q عشان تسيب' },

  result_pass: { en: 'PASS', ar: 'ناجح' },
  result_fail: { en: 'FAIL', ar: 'راسب' },
  result_critical: { en: 'CRITICAL BREACH', ar: 'مخالفة حرجة' },
  result_title: { en: 'Service Scorecard', ar: 'بطاقة تقييم الخدمة' },
  result_final_score: { en: 'Final Score', ar: 'النتيجة النهائية' },
  result_retry: { en: 'Retry', ar: 'إعادة المحاولة' },
  result_next: { en: 'Next Scenario', ar: 'المهمة التالية' },
  result_menu: { en: 'Back to Menu', ar: 'رجوع للقائمة' },
  result_share: { en: 'Copy Score to Share', ar: 'انسخ نتيجتك للمشاركة' },
  result_shared: { en: 'Copied!', ar: 'اتنسخت!' },
  result_tip_label: { en: 'Smart Power Tip', ar: 'نصيحة سمارت باور' },

  // Service Standards Card (§26) — used as fail-state flavor tips
  tip_no_extra_without_consent: {
    en: 'No extra service without the customer’s consent.',
    ar: 'مفيش خدمة إضافية بدون موافقة.',
  },
  tip_no_torn_gloves: {
    en: 'No torn gloves — ever.',
    ar: 'مفيش قفاز مقطوع.',
  },
  tip_towel_stays_in_zone: {
    en: 'A towel never changes its zone.',
    ar: 'مفيش فوطة تغير منطقتها.',
  },
  tip_no_chemical_outside_matrix: {
    en: 'No chemical outside the approved matrix.',
    ar: 'مفيش كيماوي خارج الـMatrix.',
  },
  tip_no_one_watches: {
    en: 'Nobody just watches — the whole team works.',
    ar: 'مفيش حد بيتفرج؛ الفريق كله شغال.',
  },
  tip_no_handover_before_qc: {
    en: 'No handover before QC + receipt.',
    ar: 'مفيش تسليم قبل QC + إيصال.',
  },
  tip_mats_first: {
    en: 'Mats are the first thing to start, not the last.',
    ar: 'الدواسات أول حاجة تبدأ، مش آخر حاجة.',
  },
  tip_double_check: {
    en: 'The person who did the job is never the only one who checks it.',
    ar: 'اللي نفذ الشغل مش الوحيد اللي يراجعه.',
  },
  tip_water_discipline: {
    en: 'Every litre and every minute is counted — don’t run equipment idle.',
    ar: 'كل لتر وكل دقيقة محسوبين — متسيبش المعدة شغالة من غير استخدام.',
  },

  // Scoring category labels (shared across scenarios where applicable)
  cat_technique_order: { en: 'Technique & Order', ar: 'الأسلوب والترتيب' },
  cat_towel_discipline: { en: 'Towel & Chemical Discipline', ar: 'انضباط الفوط والكيماويات' },
  cat_water_efficiency: { en: 'Water & Compressor Efficiency', ar: 'كفاءة المياه والكمبروسر' },
  cat_final_qc: { en: 'Final QC', ar: 'الفحص النهائي' },
  cat_safety_ppe: { en: 'Safety / PPE', ar: 'السلامة ومعدات الحماية' },
  cat_mats_first: { en: 'Mats-First Compliance', ar: 'الالتزام بترتيب الدواسات' },
  cat_cleaning_thoroughness: { en: 'Cleaning Thoroughness', ar: 'شمولية التنظيف' },
  cat_glass_qc: { en: 'Glass QC', ar: 'فحص الزجاج' },
  cat_ppe_prep: { en: 'PPE / Prep', ar: 'التجهيز ومعدات الحماية' },
  cat_procedure_order: { en: 'Correct Procedure Order', ar: 'ترتيب الإجراء الصحيح' },
  cat_correct_quantity: { en: 'Correct Quantity', ar: 'الكمية الصحيحة' },
  cat_leak_doublecheck: { en: 'Leak Check & Double-Check', ar: 'فحص التسريب والمراجعة المزدوجة' },
  cat_cleanliness_spill: { en: 'Cleanliness / No Spill', ar: 'النظافة وعدم الانسكاب' },

  loading: { en: 'Loading…', ar: 'جاري التحميل…' },

  tip_first_time_right: {
    en: 'Get it right the first time — no handover before the final check.',
    ar: 'الصح من أول مرة — لا تسليم قبل فحص نهائي.',
  },
  tip_no_streaks: {
    en: 'Glass finish: no streaks left behind.',
    ar: 'الزجاج: خالي من أي خطوط.',
  },
  tip_correct_quantity: {
    en: 'Correct type, correct quantity — never mix unapproved oils.',
    ar: 'النوع الصح والكمية الصح — ممنوع خلط زيوت غير معتمدة.',
  },
  tip_no_spill: {
    en: 'No oil left on the body, the engine bay, or the floor.',
    ar: 'مفيش زيت على البودي أو غرفة المحرك أو الأرض.',
  },

  // Task checklist labels
  task_ppe: { en: 'Check PPE (gloves)', ar: 'افحص معدات الحماية (القفازات)' },
  task_prerinse: { en: 'Pre-rinse the car', ar: 'اشطف العربية أول شطفة' },
  task_foam: { en: 'Apply foam', ar: 'حط الفوم' },
  task_wash_body: { en: 'Wash body (yellow towel)', ar: 'اغسل البودي (فوطة صفراء)' },
  task_wash_wheels: { en: 'Wash wheels (gray towel)', ar: 'اغسل الجنوط (فوطة رمادية)' },
  task_rinse: { en: 'Rinse the foam off', ar: 'اشطف الفوم' },
  task_dry: { en: 'Dry (white towel)', ar: 'جفف (فوطة بيضاء)' },

  task_mats_out: { en: 'Pull mats out first, hang on rack', ar: 'طلّع الدواسات أول حاجة وعلقها' },
  task_vacuum: { en: 'Vacuum the floor', ar: 'اشفط الأرضية' },
  task_dashboard: { en: 'Wipe dashboard (blue towel)', ar: 'امسح الدشبورد (فوطة زرقاء)' },
  task_glass: { en: 'Clean glass (green towel)', ar: 'نضف الزجاج (فوطة خضراء)' },
  task_mats_return: { en: 'Return clean, dry mats', ar: 'رجّع الدواسات نظيفة وجافة' },

  task_protect_floor: { en: 'Protect the floor / place waste container', ar: 'احمِ الأرضية / حط وعاء المخلفات' },
  task_confirm_oil: { en: 'Confirm oil type & quantity', ar: 'أكّد نوع وكمية الزيت' },
  task_drain: { en: 'Drain the old oil', ar: 'فرّغ الزيت القديم' },
  task_filter: { en: 'Replace the filter', ar: 'غيّر الفلتر' },
  task_refill: { en: 'Refill with the correct oil', ar: 'عبّي الزيت الصحيح' },
  task_run_engine: { en: 'Run the engine, check gauge', ar: 'شغّل المحرك وافحص المؤشر' },
  task_leak_check: { en: 'Leak check (engine on & off)', ar: 'افحص التسريب (شغال ومطفي)' },
  task_double_check: { en: 'Second pair of eyes (double-check)', ar: 'عين ثانية تراجع (مراجعة مزدوجة)' },
  task_cleanup: { en: 'Clean any spill', ar: 'نضف أي انسكاب' },

  // Held-item labels
  tool_hose: { en: 'Hose', ar: 'الخرطوم' },
  tool_foam_gun: { en: 'Foam gun', ar: 'مسدس الفوم' },
  tool_vacuum: { en: 'Vacuum', ar: 'المكنسة' },
  tool_drain_pan: { en: 'Drain pan', ar: 'وعاء التفريغ' },
  tool_new_filter: { en: 'New filter', ar: 'فلتر جديد' },
  tool_oil_jug_correct: { en: 'Mobil 1 oil', ar: 'زيت موبيل 1' },
  tool_oil_jug_generic: { en: 'Unapproved oil', ar: 'زيت غير معتمد' },

  towel_yellow: { en: 'Yellow towel (Body/Paint)', ar: 'فوطة صفراء (بودي/دهان)' },
  towel_blue: { en: 'Blue towel (Interior)', ar: 'فوطة زرقاء (داخلي)' },
  towel_green: { en: 'Green towel (Glass)', ar: 'فوطة خضراء (زجاج)' },
  towel_gray: { en: 'Gray towel (Wheels)', ar: 'فوطة رمادية (جنوط)' },
  towel_red: { en: 'Red towel (Dirty zones)', ar: 'فوطة حمراء (مناطق متسخة)' },
  towel_white: { en: 'White towel (Final drying)', ar: 'فوطة بيضاء (تجفيف نهائي)' },
};
