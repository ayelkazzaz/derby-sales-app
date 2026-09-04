/* ================= STATIC CONTENT ================= */
/* Ported unchanged from the prototype — copy, decks, labels. */

export const MOODS = [
  { key: 'connected', label: 'Connected', hint: 'Emotionally close' },
  { key: 'good', label: 'Good', hint: 'Stable and positive' },
  { key: 'neutral', label: 'Neutral', hint: 'Functional, flat' },
  { key: 'distant', label: 'Distant', hint: 'Disconnected, busy' },
  { key: 'tense', label: 'Tense', hint: 'Conflict or pressure' },
] as const;

export type MoodKey = (typeof MOODS)[number]['key'];

export const RECS: Record<string, { title: string; body: string }> = {
  connected: { title: 'Twelve minutes, fully here', body: 'You’re close tonight — a good moment to slow down together or try something playful.' },
  good: { title: 'A shared round of something light', body: 'Stable and warm. A game or a round of appreciation fits tonight.' },
  neutral: { title: 'Try something you haven’t before', body: 'Nothing urgent — a good night for a little novelty.' },
  distant: { title: 'Bring the focus back', body: 'A few minutes of undivided attention can close the gap.' },
  tense: { title: 'Slow down before solving it', body: 'Consider a short pause before working through what’s tight.' },
  default: { title: 'How are you both, tonight?', body: 'Choose a mood above and EVE will suggest a starting point.' },
};

export const NAV_TABS = [
  { key: 'tonight', label: 'Tonight' },
  { key: 'spark', label: 'Spark' },
  { key: 'play', label: 'Play' },
  { key: 'repair', label: 'Repair' },
  { key: 'us', label: 'Us' },
  { key: 'vault', label: 'Vault' },
] as const;

export interface FeatureDef { key: string; label: string; category: string; blurb: string; requiresPairing?: boolean }

export const FEATURES: FeatureDef[] = [
  { key: 'chaos', label: 'Couple Chaos', category: 'play', blurb: 'Fast questions, dares and points — first to seven wins.' },
  { key: 'pickup', label: 'Pickup-Line Battle', category: 'play', blurb: 'Deliver the line, your partner scores the charm.' },
  { key: 'afterdark', label: 'After Dark', category: 'play', blurb: 'Playful, consent-first intimate cards for two, 18+.' },
  { key: 'guessme', label: 'Guess Me', category: 'play', blurb: 'How well do you really know each other?' },
  { key: 'wyr', label: 'Would You Rather', category: 'play', blurb: 'Choose privately, reveal together.' },
  { key: 'challenge', label: 'Challenge Deck', category: 'play', blurb: 'Quick, romantic and adventurous missions.' },
  { key: 'dailyentice', label: 'Daily Entice', category: 'spark', blurb: 'One small connection ritual, chosen for today.' },
  { key: 'secretmatch', label: 'Secret Match', category: 'spark', requiresPairing: true, blurb: 'Private choices — only mutual picks are ever revealed.' },
  { key: 'repair', label: 'Repair Mode', category: 'repair', requiresPairing: true, blurb: 'Slow down and work through friction together.' },
  { key: 'enticeus', label: 'Entice Us', category: 'spark', blurb: 'A surprise, matched to your time, energy and budget.' },
  { key: 'dna', label: 'Couple DNA', category: 'us', requiresPairing: true, blurb: 'How you each connect, play and handle conflict.' },
  { key: 'dream', label: 'Dream Together', category: 'us', blurb: 'Turn shared hopes into a plan with a first step.' },
  { key: 'vault', label: 'Our Vault', category: 'vault', blurb: 'Memories, appreciations and milestones worth keeping.' },
  { key: 'consent', label: 'Consent Center', category: 'us', blurb: 'What’s private, what’s shared, and what’s opt-in.' },
];

export const CHAOS_DECK = [
  { cat: 'Fast Question', text: 'Name three songs that always make you dance.' },
  { cat: 'Silly Dare', text: 'Do your best red-carpet walk across the room.' },
  { cat: 'Who’s More Likely', text: 'Who’s more likely to cry during a commercial?' },
  { cat: 'Acting Challenge', text: 'Act out ordering coffee like you’re in an action movie.' },
  { cat: 'Trivia', text: 'What was the first thing you two ever cooked together? Closest guess wins.' },
  { cat: 'Impression', text: 'Do an impression of your partner ordering food.' },
  { cat: 'Story Challenge', text: 'Tell a 30-second story where you’re secretly a spy — improvise the ending.' },
  { cat: 'Affection Challenge', text: 'Say one thing you’ve never told your partner you appreciate.' },
  { cat: 'Mini Competition', text: 'Thumb war, best of three — loser does the next dare.' },
  { cat: 'Memory Challenge', text: 'Describe what your partner was wearing the last time you went out.' },
  { cat: 'Fast Question', text: 'Beach or mountains, and why — five seconds, go.' },
  { cat: 'Silly Dare', text: 'Talk in an accent for the next two rounds.' },
  { cat: 'Who’s More Likely', text: 'Who’s more likely to win an argument with a stranger?' },
  { cat: 'Acting Challenge', text: 'Recreate the moment you first flirted with each other.' },
  { cat: 'Trivia', text: 'Name your partner’s comfort food without asking them.' },
  { cat: 'Affection Challenge', text: 'Give a sincere, uninterrupted 20-second compliment.' },
];

export const FORFEITS = [
  'Make your partner their favorite drink.',
  'Give a sincere thirty-second compliment.',
  'Let your partner choose the next song.',
  'Dramatically recreate your first flirt.',
  'Give a two-minute shoulder massage.',
  'Plan tomorrow’s small surprise.',
  'Send a genuinely sweet text right now.',
  'Do your best impression of your partner for ten seconds.',
];

export const PICKUP_LINES = [
  'Are you a parking ticket? Because you’ve got fine written all over you.',
  'Do you have a map? I just got lost in your eyes.',
  'Is it hot in here, or is it just you?',
  'If I could rearrange the alphabet, I’d put U and I together.',
  'You must be tired — you’ve been running through my mind all day.',
  'Excuse me, but I think you dropped something: my jaw.',
  'Are you made of copper and tellurium? Because you’re Cu-Te.',
  'I was going to say something sweet, but you beat me to it just by walking in.',
  'Is your name Google? Because you’re everything I’ve been searching for.',
  'Do you believe in love at first sight, or should I walk by again?',
  'You’re so lovely you made me forget my pickup line.',
  'If kisses were snowflakes, I’d send you a blizzard.',
];

export const WYR_DECK = [
  { a: 'Never eat pizza again', b: 'Never eat pasta again', cat: 'Funny' },
  { a: 'Always be 10 minutes early', b: 'Always be 10 minutes late', cat: 'Lifestyle' },
  { a: 'Take a spontaneous weekend trip', b: 'Plan a dream vacation a year out', cat: 'Adventure' },
  { a: 'Get a handwritten letter', b: 'Get a surprise gift', cat: 'Romantic' },
  { a: 'Live by the beach', b: 'Live in the mountains', cat: 'Lifestyle' },
  { a: 'Have unlimited travel budget', b: 'Have unlimited time off', cat: 'Future' },
  { a: 'Slow dance in the kitchen', b: 'Stargaze on a rooftop', cat: 'Romantic' },
  { a: 'Wake up early together', b: 'Stay up late together', cat: 'Lifestyle' },
  { a: 'Get a couple’s massage', b: 'Take a cooking class together', cat: 'Adventure' },
  { a: 'Always know what your partner is thinking', b: 'Always know what they need', cat: 'Funny' },
  { a: 'Renew your vows every year', b: 'Never repeat a date idea', cat: 'Future' },
  { a: 'A quiet night in, just the two of you', b: 'A night out with your closest friends', cat: 'Warm' },
  { a: 'Get flowers for no reason', b: 'Get a love note for no reason', cat: 'Romantic' },
  { a: 'Explore a new city together', b: 'Return to your favorite place together', cat: 'Adventure' },
];

export const GUESS_DECK = [
  { q: 'What’s their comfort food when they’ve had a rough day?' },
  { q: 'What do they need most when they’re stressed — space or reassurance?' },
  { q: 'What’s a small habit of theirs most people don’t notice?' },
  { q: 'What was their favorite memory from the last month?' },
  { q: 'What’s one thing on their bucket list they haven’t said out loud?' },
  { q: 'How do they prefer to receive affection — words, touch or actions?' },
  { q: 'What’s their go-to order at your favorite restaurant?' },
  { q: 'What’s a song that reminds them of you?' },
  { q: 'What’s something they’re quietly proud of?' },
  { q: 'What do they actually want on a hard day — advice or just company?' },
  { q: 'What’s a childhood memory they’ve mentioned more than once?' },
  { q: 'What’s their least favorite chore?' },
  { q: 'What’s a compliment they never get tired of hearing?' },
  { q: 'What’s one thing they wish you asked them about more?' },
];

export const SECRET_OPTIONS = [
  { key: 'kiss', label: 'A long, unhurried kiss', category: 'Affection' },
  { key: 'massage', label: 'A slow massage exchange', category: 'Intimacy' },
  { key: 'dressup', label: 'A dress-up date night', category: 'Romance' },
  { key: 'flirty_texts', label: 'A day of flirty messages', category: 'Communication' },
  { key: 'new_thing', label: 'Try something neither of us has done', category: 'Adventure' },
  { key: 'slow_night', label: 'A slow, private night in', category: 'Intimacy' },
  { key: 'surprise_date', label: 'Plan a surprise date for each other', category: 'Dates' },
  { key: 'morning_in_bed', label: 'Breakfast in bed, no reason needed', category: 'Romance' },
  { key: 'road_trip', label: 'A spontaneous overnight trip', category: 'Adventure' },
  { key: 'deep_talk', label: 'A no-phones deep conversation', category: 'Communication' },
  { key: 'dance', label: 'A slow dance in the kitchen', category: 'Romance' },
  { key: 'love_notes', label: 'Hidden love notes for a week', category: 'Affection' },
  { key: 'bath', label: 'A shared bath or long shower', category: 'Intimacy' },
  { key: 'photo_walk', label: 'A photo walk somewhere new', category: 'Adventure' },
];

export const DNA_DIMENSIONS = [
  { key: 'connection', noun: 'connection', prompt: 'I feel most connected through…', options: [
    { v: 'attention', l: 'Undivided attention' }, { v: 'support', l: 'Practical support' },
    { v: 'touch', l: 'Affection and touch' }, { v: 'admiration', l: 'Admiration and reassurance' },
    { v: 'adventure', l: 'Shared adventure' },
  ] },
  { key: 'stress', noun: 'stress relief', prompt: 'When stressed, I usually need…', options: [
    { v: 'space', l: 'Space, then reconnection' }, { v: 'reassurance', l: 'Immediate reassurance' },
    { v: 'help', l: 'Practical help' }, { v: 'quiet', l: 'Quiet company' }, { v: 'humor', l: 'Humor and lightness' },
  ] },
  { key: 'conflict', noun: 'handling conflict', prompt: 'During conflict, I tend to…', options: [
    { v: 'pursue', l: 'Pursue resolution quickly' }, { v: 'withdraw', l: 'Withdraw to regulate' },
    { v: 'defend', l: 'Defend and explain' }, { v: 'accommodate', l: 'Accommodate to restore peace' },
  ] },
  { key: 'play', noun: 'play', prompt: 'My preferred play style is…', options: [
    { v: 'competitive', l: 'Competitive' }, { v: 'silly', l: 'Silly and spontaneous' },
    { v: 'creative', l: 'Creative' }, { v: 'adventurous', l: 'Adventure-seeking' }, { v: 'cozy', l: 'Cozy and relaxed' },
  ] },
  { key: 'desire', noun: 'desire', prompt: 'Desire grows for me through…', options: [
    { v: 'closeness', l: 'Emotional closeness' }, { v: 'anticipation', l: 'Anticipation and flirting' },
    { v: 'novelty', l: 'Novelty' }, { v: 'relaxation', l: 'Relaxation and privacy' }, { v: 'desired', l: 'Feeling desired' },
  ] },
] as const;

export type DnaDimensionKey = (typeof DNA_DIMENSIONS)[number]['key'];

export const DNA_LABELS: Record<string, Record<string, string>> = {};
DNA_DIMENSIONS.forEach((d) => {
  DNA_LABELS[d.key] = {};
  d.options.forEach((o) => { DNA_LABELS[d.key][o.v] = o.l; });
});

export function combinedTheme(dim: { key: string; noun: string }, aVal?: string | null, bVal?: string | null) {
  const labels = DNA_LABELS[dim.key];
  if (!aVal || !bVal || !labels[aVal] || !labels[bVal]) return null;
  if (aVal === bVal) return `You both find ${dim.noun} through ${labels[aVal].toLowerCase()}.`;
  return `One of you leans on ${labels[aVal].toLowerCase()}, the other on ${labels[bVal].toLowerCase()} — worth naming out loud.`;
}

export const DAILY_POOL = [
  { title: 'One honest appreciation', body: 'Tell your partner one specific thing they did this week that you’re grateful for.' },
  { title: 'Seven-minute check-in', body: 'Put phones away and ask: what’s been on your mind that we haven’t talked about?' },
  { title: 'Small act of support', body: 'Take one thing off your partner’s plate today, without being asked.' },
  { title: 'Memory prompt', body: 'Describe your favorite date together in as much detail as you can remember.' },
  { title: 'Playful challenge', body: 'Take a photo that captures how you feel about each other right now.' },
  { title: 'Affectionate action', body: 'Give a hug that lasts at least twenty seconds — no talking.' },
  { title: 'One meaningful question', body: 'Ask: what’s something you’re looking forward to that we haven’t discussed?' },
  { title: 'Gratitude swap', body: 'Each say one thing about today that you’re thankful for.' },
  { title: 'Undivided attention', body: 'Spend ten minutes together with no phones, no TV — just talking.' },
  { title: 'Compliment on purpose', body: 'Compliment something about your partner that isn’t about how they look.' },
  { title: 'Plan something small', body: 'Pick one small thing to look forward to this week, together.' },
  { title: 'Check the temperature', body: 'Ask: on a scale of 1-10, how connected do you feel to me this week?' },
];

export const REPAIR_ACTIONS = [
  'Plan a proper conversation this week, no distractions.',
  'Give a specific, sincere apology for your part.',
  'Do one thing today that shows you heard them.',
  'Write down what you each need going forward.',
  'Plan something small to reconnect this week.',
  'Check in again tomorrow at the same time.',
  'Agree on one boundary to try together.',
];

export const ACHIEVEMENTS = [
  { key: 'first_pulse', label: 'First Pulse', desc: 'Shared how you’re feeling for the first time.' },
  { key: 'paired', label: 'Paired Together', desc: 'Created a private space together.' },
  { key: 'first_game', label: 'First Game', desc: 'Finished your first game together.' },
  { key: 'played_every_game', label: 'Full House', desc: 'Played every built game at least once.' },
  { key: 'first_repair', label: 'First Repair', desc: 'Set a repair action after a disagreement.' },
  { key: 'first_secret_match', label: 'Mutual Match', desc: 'Found your first Secret Match.' },
  { key: 'dna_complete', label: 'Couple DNA Mapped', desc: 'Both of you completed your Couple DNA profile.' },
  { key: 'three_day_streak', label: 'Three-Day Streak', desc: 'Completed Daily Entice three days running.' },
  { key: 'first_dream', label: 'First Shared Dream', desc: 'Added your first dream to Dream Together.' },
  { key: 'first_memory', label: 'First Saved Memory', desc: 'Saved your first entry to Our Vault.' },
  { key: 'ten_appreciations', label: 'Ten Appreciations', desc: 'Logged ten appreciations in Our Vault.' },
];

export const CHALLENGE_DECK = [
  { id: 'c1', category: 'Quick', title: 'Two-Minute Check-In', body: 'Ask each other: what’s one small thing you need today?', time: '15', energy: 'low', budget: 'free' },
  { id: 'c2', category: 'Romantic', title: 'Candlelit Nothing', body: 'Light candles, put on music you both love, and just be in the room together.', time: '30', energy: 'low', budget: 'low' },
  { id: 'c3', category: 'Helpful', title: 'Take One Thing Off Their Plate', body: 'Pick a chore your partner’s been putting off and just do it.', time: '30', energy: 'medium', budget: 'free' },
  { id: 'c4', category: 'Adventurous', title: 'Somewhere You’ve Never Been', body: 'Go somewhere neither of you has been before, even ten minutes away.', time: '60', energy: 'high', budget: 'medium' },
  { id: 'c5', category: 'Funny', title: 'Recreate Your First Photo', body: 'Recreate the very first photo you ever took together.', time: '15', energy: 'medium', budget: 'free' },
  { id: 'c6', category: 'Affectionate', title: 'The Twenty-Second Hug', body: 'A hug that lasts twenty full seconds, no talking.', time: '15', energy: 'low', budget: 'free' },
  { id: 'c7', category: 'Quick', title: 'One Honest Question', body: 'Ask something you’ve been curious about but haven’t asked.', time: '15', energy: 'low', budget: 'free' },
  { id: 'c8', category: 'Romantic', title: 'Slow Dinner', body: 'Cook or order something neither of you has tried, no phones at the table.', time: '60', energy: 'low', budget: 'medium' },
  { id: 'c9', category: 'Helpful', title: 'Morning Set-Up', body: 'Set up tomorrow morning for your partner — coffee ready, something small prepped.', time: '15', energy: 'low', budget: 'free' },
  { id: 'c10', category: 'Adventurous', title: 'Reverse the Route', body: 'Take your usual walk or drive in reverse, and notice what you’ve never noticed.', time: '30', energy: 'medium', budget: 'free' },
  { id: 'c11', category: 'Funny', title: 'Bad Movie Night', body: 'Pick the worst-reviewed movie you can find and commentate through it together.', time: '30', energy: 'medium', budget: 'low' },
  { id: 'c12', category: 'Affectionate', title: 'Handwritten', body: 'Write down three things you love about your partner and leave it somewhere they’ll find it.', time: '30', energy: 'low', budget: 'free' },
  { id: 'c13', category: 'Quick', title: 'Song Swap', body: 'Each pick a song that describes how you feel right now and explain why.', time: '15', energy: 'medium', budget: 'free' },
  { id: 'c14', category: 'Romantic', title: 'Golden Hour', body: 'Watch the sunset together, phones away, and talk about where you see yourselves in a year.', time: '60', energy: 'medium', budget: 'medium' },
  { id: 'c15', category: 'Adventurous', title: 'New Neighborhood', body: 'Explore a neighborhood you’ve never spent time in and find one place to come back to.', time: '60', energy: 'high', budget: 'low' },
  { id: 'c16', category: 'Affectionate', title: 'Say It Out Loud', body: 'Say one thing about your partner you’re quietly proud of.', time: '15', energy: 'low', budget: 'free' },
];

export const ENTICEUS_DECK = [
  { id: 'e1', time: '30', energy: 'low', budget: 'free', text: 'Turn off the lights and slow dance to one song you both love.' },
  { id: 'e2', time: '45', energy: 'medium', budget: 'low', text: 'Each buy a snack the other has never tried, meet somewhere with a view, and trade.' },
  { id: 'e3', time: '15', energy: 'low', budget: 'free', text: 'Sit outside together and name three things you’re grateful for about this week.' },
  { id: 'e4', time: '60', energy: 'high', budget: 'medium', text: 'Take a class together in something neither of you has done before.' },
  { id: 'e5', time: '15', energy: 'low', budget: 'free', text: 'Write each other a note about a favorite shared memory and swap.' },
  { id: 'e6', time: '30', energy: 'medium', budget: 'free', text: 'Cook one dish from a country neither of you has visited.' },
  { id: 'e7', time: '15', energy: 'low', budget: 'free', text: 'Take turns giving a two-minute hand or shoulder massage.' },
  { id: 'e8', time: '45', energy: 'medium', budget: 'medium', text: 'Go somewhere you used to go early in your relationship and order what you ordered then.' },
  { id: 'e9', time: '60', energy: 'high', budget: 'low', text: 'Plan and take a spontaneous walk somewhere neither of you has explored.' },
  { id: 'e10', time: '15', energy: 'low', budget: 'free', text: 'Take a candid photo of each other and talk about why you chose that moment.' },
  { id: 'e11', time: '30', energy: 'low', budget: 'low', text: 'Order dessert first, no matter what.' },
  { id: 'e12', time: '15', energy: 'medium', budget: 'free', text: 'Each describe your ideal ordinary Sunday, ten years from now.' },
  { id: 'e13', time: '60', energy: 'medium', budget: 'medium', text: 'Plan next year’s trip together, even if it’s just a wishlist.' },
  { id: 'e14', time: '15', energy: 'low', budget: 'free', text: 'Trade three compliments you don’t say often enough.' },
];

export const AFTERDARK_DECK = [
  { category: 'Flirty Question', tier: 'warm', text: 'What’s the first thing you noticed about me?' },
  { category: 'Romantic Anticipation', tier: 'warm', text: 'Describe how you’d want tonight to slow down, if we let it.' },
  { category: 'Affection Prompt', tier: 'warm', text: 'Tell me one way I make you feel wanted.' },
  { category: 'Chemistry Card', tier: 'warm', text: 'What’s your favorite way to be kissed?' },
  { category: 'Desire Conversation', tier: 'warm', text: 'What made you fall for me, physically, at first?' },
  { category: 'Private Date Idea', tier: 'warm', text: 'Describe a night where it’s just us and no clock.' },
  { category: 'Playful Intimate Dare', tier: 'playful', text: 'Whisper one thing you’re looking forward to tonight.' },
  { category: 'Chemistry Card', tier: 'playful', text: 'Give a slow kiss on the neck and see who breaks first.' },
  { category: 'Desire Conversation', tier: 'playful', text: 'Describe the outfit you’d want to surprise me in.' },
  { category: 'Flirty Question', tier: 'playful', text: 'What’s a small thing I do that drives you a little crazy, in a good way?' },
  { category: 'Desire Conversation', tier: 'spicy', text: 'Describe the last time you couldn’t stop thinking about me.' },
  { category: 'Chemistry Card', tier: 'spicy', text: 'Trace a slow line from my collarbone to my wrist — no words.' },
  { category: 'Private Date Idea', tier: 'spicy', text: 'Describe the moment tonight you’d want my full, undivided attention.' },
  { category: 'Desire Conversation', tier: 'bold', text: 'Share one thing you’ve been wanting to try together, out loud.' },
  { category: 'Playful Intimate Dare', tier: 'bold', text: 'Take the lead for the next five minutes — your partner follows, no questions.' },
];

export const DREAM_CATEGORIES = ['Relationship', 'Home', 'Travel', 'Wellbeing', 'Family', 'Career', 'Financial', 'Learning', 'Adventure', 'Lifestyle'];
export const DREAM_STATUSES = ['Idea', 'Planning', 'In progress', 'Achieved', 'Archived'];
export const VAULT_TYPES = ['Memory', 'Appreciation', 'Milestone', 'Inside Joke', 'Lesson'];
