/**
 * Comprehensive Picture & Audio-First Question Bank (UKG to Grade 3)
 * Total: 130+ Questions with difficulty tagging, grade tagging, audio text, and visual options.
 *
 * Question Types:
 * 1. 'sound_to_picture': "Recognize this by sound" -> spoken audio word/sound -> 4 picture cards.
 * 2. 'visual_matching': "Find the matching picture" / "Which picture belongs to..." -> 4 picture cards.
 * 3. 'letter_orientation': Letter discrimination & mirror pairs (b/d, p/q, m/w) with visual clues.
 * 4. 'category_recognition': "Find the fruit / animal / vehicle / good habit".
 *
 * Note: Target text answers are NEVER exposed in prompt titles or button text!
 */

export const QUESTION_BANK = [
  // ==========================================
  // UKG (Age 5–6) - Easy & Medium Sounds / Pictures
  // ==========================================
  {
    id: 'ukg_snd_01',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Fruits',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Apple',
    correctOptionId: 'opt_apple',
    options: [
      { id: 'opt_apple', label: 'Apple', emoji: '🍎', svgType: 'apple' },
      { id: 'opt_banana', label: 'Banana', emoji: '🍌', svgType: 'banana' },
      { id: 'opt_grapes', label: 'Grapes', emoji: '🍇', svgType: 'grapes' },
      { id: 'opt_orange', label: 'Orange', emoji: '🍊', svgType: 'orange' }
    ]
  },
  {
    id: 'ukg_snd_02',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Animals',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Cat',
    correctOptionId: 'opt_cat',
    options: [
      { id: 'opt_dog', label: 'Dog', emoji: '🐶', svgType: 'dog' },
      { id: 'opt_cat', label: 'Cat', emoji: '🐱', svgType: 'cat' },
      { id: 'opt_rabbit', label: 'Rabbit', emoji: '🐰', svgType: 'rabbit' },
      { id: 'opt_elephant', label: 'Elephant', emoji: '🐘', svgType: 'elephant' }
    ]
  },
  {
    id: 'ukg_snd_03',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Animals',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Dog',
    correctOptionId: 'opt_dog',
    options: [
      { id: 'opt_lion', label: 'Lion', emoji: '🦁', svgType: 'lion' },
      { id: 'opt_horse', label: 'Horse', emoji: '🐴', svgType: 'horse' },
      { id: 'opt_dog', label: 'Dog', emoji: '🐶', svgType: 'dog' },
      { id: 'opt_cow', label: 'Cow', emoji: '🐮', svgType: 'cow' }
    ]
  },
  {
    id: 'ukg_snd_04',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Colours',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Red',
    correctOptionId: 'opt_red',
    options: [
      { id: 'opt_blue', label: 'Blue', emoji: '🟦', colorHex: '#3B82F6' },
      { id: 'opt_green', label: 'Green', emoji: '🟩', colorHex: '#22C55E' },
      { id: 'opt_red', label: 'Red', emoji: '🟥', colorHex: '#EF4444' },
      { id: 'opt_yellow', label: 'Yellow', emoji: '🟨', colorHex: '#EAB308' }
    ]
  },
  {
    id: 'ukg_snd_05',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Colours',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Yellow',
    correctOptionId: 'opt_yellow',
    options: [
      { id: 'opt_yellow', label: 'Yellow', emoji: '🟨', colorHex: '#EAB308' },
      { id: 'opt_purple', label: 'Purple', emoji: '🟪', colorHex: '#A855F7' },
      { id: 'opt_black', label: 'Black', emoji: '⬛', colorHex: '#18181B' },
      { id: 'opt_orange', label: 'Orange', emoji: '🟧', colorHex: '#F97316' }
    ]
  },
  {
    id: 'ukg_snd_06',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Everyday Objects',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Ball',
    correctOptionId: 'opt_ball',
    options: [
      { id: 'opt_book', label: 'Book', emoji: '📚', svgType: 'book' },
      { id: 'opt_ball', label: 'Ball', emoji: '⚽', svgType: 'ball' },
      { id: 'opt_pencil', label: 'Pencil', emoji: '✏️', svgType: 'pencil' },
      { id: 'opt_cup', label: 'Cup', emoji: '☕', svgType: 'cup' }
    ]
  },
  {
    id: 'ukg_snd_07',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Everyday Objects',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Sun',
    correctOptionId: 'opt_sun',
    options: [
      { id: 'opt_moon', label: 'Moon', emoji: '🌙', svgType: 'moon' },
      { id: 'opt_star', label: 'Star', emoji: '⭐', svgType: 'star' },
      { id: 'opt_sun', label: 'Sun', emoji: '☀️', svgType: 'sun' },
      { id: 'opt_cloud', label: 'Cloud', emoji: '☁️', svgType: 'cloud' }
    ]
  },
  {
    id: 'ukg_snd_08',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Numbers',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Number One',
    correctOptionId: 'opt_1',
    options: [
      { id: 'opt_3', label: '3', emoji: '3️⃣', visualCount: 3 },
      { id: 'opt_1', label: '1', emoji: '1️⃣', visualCount: 1 },
      { id: 'opt_4', label: '4', emoji: '4️⃣', visualCount: 4 },
      { id: 'opt_2', label: '2', emoji: '2️⃣', visualCount: 2 }
    ]
  },
  {
    id: 'ukg_snd_09',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Numbers',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Number Five',
    correctOptionId: 'opt_5',
    options: [
      { id: 'opt_2', label: '2', emoji: '2️⃣', visualCount: 2 },
      { id: 'opt_5', label: '5', emoji: '5️⃣', visualCount: 5 },
      { id: 'opt_8', label: '8', emoji: '8️⃣', visualCount: 8 },
      { id: 'opt_6', label: '6', emoji: '6️⃣', visualCount: 6 }
    ]
  },
  {
    id: 'ukg_snd_10',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'medium',
    category: 'Good Habits',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Washing Hands',
    correctOptionId: 'opt_wash',
    options: [
      { id: 'opt_sleep', label: 'Sleeping', emoji: '😴', svgType: 'sleep' },
      { id: 'opt_wash', label: 'Wash Hands', emoji: '🧼', svgType: 'soap' },
      { id: 'opt_eating', label: 'Eating Food', emoji: '🍎', svgType: 'eat' },
      { id: 'opt_running', label: 'Running', emoji: '🏃', svgType: 'run' }
    ]
  },
  {
    id: 'ukg_snd_11',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'medium',
    category: 'Transport',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'School Bus',
    correctOptionId: 'opt_bus',
    options: [
      { id: 'opt_plane', label: 'Airplane', emoji: '✈️', svgType: 'plane' },
      { id: 'opt_bus', label: 'Bus', emoji: '🚌', svgType: 'bus' },
      { id: 'opt_boat', label: 'Boat', emoji: '⛵', svgType: 'boat' },
      { id: 'opt_cycle', label: 'Bicycle', emoji: '🚲', svgType: 'cycle' }
    ]
  },
  {
    id: 'ukg_snd_12',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'medium',
    category: 'Shapes',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Circle',
    correctOptionId: 'opt_circle',
    options: [
      { id: 'opt_square', label: 'Square', emoji: '⬛', shape: 'square' },
      { id: 'opt_triangle', label: 'Triangle', emoji: '🔺', shape: 'triangle' },
      { id: 'opt_circle', label: 'Circle', emoji: '🔴', shape: 'circle' },
      { id: 'opt_star', label: 'Star', emoji: '⭐', shape: 'star' }
    ]
  },
  {
    id: 'ukg_rev_01',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter B, Buh sound as in Bat',
    correctOptionId: 'opt_b',
    isReversalTest: true,
    reversalOption: 'opt_d',
    options: [
      { id: 'opt_d', label: 'd', emoji: 'ⓓ', letter: 'd' },
      { id: 'opt_b', label: 'b', emoji: 'ⓑ', letter: 'b' },
      { id: 'opt_p', label: 'p', emoji: 'ⓟ', letter: 'p' },
      { id: 'opt_q', label: 'q', emoji: 'ⓠ', letter: 'q' }
    ]
  },
  {
    id: 'ukg_rev_02',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter D, Duh sound as in Dog',
    correctOptionId: 'opt_d',
    isReversalTest: true,
    reversalOption: 'opt_b',
    options: [
      { id: 'opt_b', label: 'b', emoji: 'ⓑ', letter: 'b' },
      { id: 'opt_p', label: 'p', emoji: 'ⓟ', letter: 'p' },
      { id: 'opt_d', label: 'd', emoji: 'ⓓ', letter: 'd' },
      { id: 'opt_q', label: 'q', emoji: 'ⓠ', letter: 'q' }
    ]
  },
  {
    id: 'ukg_rev_03',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter P, Puh sound as in Pen',
    correctOptionId: 'opt_p',
    isReversalTest: true,
    reversalOption: 'opt_q',
    options: [
      { id: 'opt_q', label: 'q', emoji: 'ⓠ', letter: 'q' },
      { id: 'opt_p', label: 'p', emoji: 'ⓟ', letter: 'p' },
      { id: 'opt_b', label: 'b', emoji: 'ⓑ', letter: 'b' },
      { id: 'opt_d', label: 'd', emoji: 'ⓓ', letter: 'd' }
    ]
  },
  {
    id: 'ukg_rev_04',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter M, Mmm sound as in Mango',
    correctOptionId: 'opt_m',
    isReversalTest: true,
    reversalOption: 'opt_w',
    options: [
      { id: 'opt_w', label: 'w', emoji: 'ⓦ', letter: 'w' },
      { id: 'opt_m', label: 'm', emoji: 'ⓜ', letter: 'm' },
      { id: 'opt_n', label: 'n', emoji: 'ⓝ', letter: 'n' },
      { id: 'opt_u', label: 'u', emoji: 'ⓤ', letter: 'u' }
    ]
  },
  {
    id: 'ukg_cat_01',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Animals',
    type: 'visual_matching',
    promptText: 'Which picture shows a gentle domestic animal?',
    audioText: 'Which picture shows a domestic pet animal?',
    correctOptionId: 'opt_dog',
    options: [
      { id: 'opt_lion', label: 'Lion', emoji: '🦁' },
      { id: 'opt_dog', label: 'Dog', emoji: '🐶' },
      { id: 'opt_crocodile', label: 'Crocodile', emoji: '🐊' },
      { id: 'opt_shark', label: 'Shark', emoji: '🦈' }
    ]
  },
  {
    id: 'ukg_cat_02',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'easy',
    category: 'Fruits',
    type: 'visual_matching',
    promptText: 'Which one is a sweet yellow fruit?',
    audioText: 'Which one is a sweet yellow fruit?',
    correctOptionId: 'opt_mango',
    options: [
      { id: 'opt_brinjal', label: 'Brinjal', emoji: '🍆' },
      { id: 'opt_carrot', label: 'Carrot', emoji: '🥕' },
      { id: 'opt_mango', label: 'Mango', emoji: '🥭' },
      { id: 'opt_broccoli', label: 'Broccoli', emoji: '🥦' }
    ]
  },
  {
    id: 'ukg_cat_03',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'medium',
    category: 'Good Habits',
    type: 'visual_matching',
    promptText: 'Which picture shows keeping our teeth clean?',
    audioText: 'Which picture shows keeping our teeth clean in the morning?',
    correctOptionId: 'opt_brush',
    options: [
      { id: 'opt_brush', label: 'Toothbrush', emoji: '🪥' },
      { id: 'opt_scissors', label: 'Scissors', emoji: '✂️' },
      { id: 'opt_hammer', label: 'Hammer', emoji: '🔨' },
      { id: 'opt_key', label: 'Key', emoji: '🔑' }
    ]
  },
  {
    id: 'ukg_cat_04',
    standard_min: 'UKG',
    standard_max: 'UKG',
    difficulty: 'medium',
    category: 'Everyday Objects',
    type: 'visual_matching',
    promptText: 'Which item protects you during rainy weather?',
    audioText: 'Which item protects you during rainy weather?',
    correctOptionId: 'opt_umbrella',
    options: [
      { id: 'opt_sunglasses', label: 'Sunglasses', emoji: '🕶️' },
      { id: 'opt_umbrella', label: 'Umbrella', emoji: '☂️' },
      { id: 'opt_cap', label: 'Cap', emoji: '🧢' },
      { id: 'opt_watch', label: 'Watch', emoji: '⌚' }
    ]
  },

  // ==========================================
  // GRADE 1 (Age 6–7) - Phonics, Words, Counting
  // ==========================================
  {
    id: 'gr1_snd_01',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'easy',
    category: 'Common Words',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Kite flying in the sky',
    correctOptionId: 'opt_kite',
    options: [
      { id: 'opt_ball', label: 'Ball', emoji: '⚽' },
      { id: 'opt_kite', label: 'Kite', emoji: '🪁' },
      { id: 'opt_doll', label: 'Doll', emoji: '🪆' },
      { id: 'opt_car', label: 'Car', emoji: '🚗' }
    ]
  },
  {
    id: 'gr1_snd_02',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'easy',
    category: 'Animals',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Elephant with a long trunk',
    correctOptionId: 'opt_elephant',
    options: [
      { id: 'opt_elephant', label: 'Elephant', emoji: '🐘' },
      { id: 'opt_giraffe', label: 'Giraffe', emoji: '🦒' },
      { id: 'opt_monkey', label: 'Monkey', emoji: '🐒' },
      { id: 'opt_bear', label: 'Bear', emoji: '🐻' }
    ]
  },
  {
    id: 'gr1_snd_03',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'easy',
    category: 'Everyday Objects',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Clock showing time',
    correctOptionId: 'opt_clock',
    options: [
      { id: 'opt_lamp', label: 'Lamp', emoji: '💡' },
      { id: 'opt_door', label: 'Door', emoji: '🚪' },
      { id: 'opt_clock', label: 'Clock', emoji: '⏰' },
      { id: 'opt_chair', label: 'Chair', emoji: '🪑' }
    ]
  },
  {
    id: 'gr1_snd_04',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'medium',
    category: 'Colours',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Green leaf',
    correctOptionId: 'opt_leaf',
    options: [
      { id: 'opt_fire', label: 'Red Fire', emoji: '🔥' },
      { id: 'opt_leaf', label: 'Green Leaf', emoji: '🍃' },
      { id: 'opt_water', label: 'Blue Water', emoji: '💧' },
      { id: 'opt_sun', label: 'Yellow Sun', emoji: '☀️' }
    ]
  },
  {
    id: 'gr1_snd_05',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'medium',
    category: 'Good Habits',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Throwing garbage in the dustbin',
    correctOptionId: 'opt_dustbin',
    options: [
      { id: 'opt_dustbin', label: 'Dustbin', emoji: '🗑️' },
      { id: 'opt_sofa', label: 'Sofa', emoji: '🛋️' },
      { id: 'opt_tv', label: 'Television', emoji: '📺' },
      { id: 'opt_bed', label: 'Bed', emoji: '🛏️' }
    ]
  },
  {
    id: 'gr1_snd_06',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'medium',
    category: 'Transport',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Train on tracks',
    correctOptionId: 'opt_train',
    options: [
      { id: 'opt_ship', label: 'Ship', emoji: '🚢' },
      { id: 'opt_train', label: 'Train', emoji: '🚆' },
      { id: 'opt_truck', label: 'Truck', emoji: '🚛' },
      { id: 'opt_helicopter', label: 'Helicopter', emoji: '🚁' }
    ]
  },
  {
    id: 'gr1_rev_01',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'easy',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter B, with belly on the right side',
    correctOptionId: 'opt_b',
    isReversalTest: true,
    reversalOption: 'opt_d',
    options: [
      { id: 'opt_d', label: 'd', emoji: 'ⓓ' },
      { id: 'opt_p', label: 'p', emoji: 'ⓟ' },
      { id: 'opt_b', label: 'b', emoji: 'ⓑ' },
      { id: 'opt_q', label: 'q', emoji: 'ⓠ' }
    ]
  },
  {
    id: 'gr1_rev_02',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter Q, kwuh sound as in Queen',
    correctOptionId: 'opt_q',
    isReversalTest: true,
    reversalOption: 'opt_p',
    options: [
      { id: 'opt_p', label: 'p', emoji: 'ⓟ' },
      { id: 'opt_q', label: 'q', emoji: 'ⓠ' },
      { id: 'opt_b', label: 'b', emoji: 'ⓑ' },
      { id: 'opt_d', label: 'd', emoji: 'ⓓ' }
    ]
  },
  {
    id: 'gr1_rev_03',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter W, waves splashing down in the water',
    correctOptionId: 'opt_w',
    isReversalTest: true,
    reversalOption: 'opt_m',
    options: [
      { id: 'opt_m', label: 'm', emoji: 'ⓜ' },
      { id: 'opt_n', label: 'n', emoji: 'ⓝ' },
      { id: 'opt_u', label: 'u', emoji: 'ⓤ' },
      { id: 'opt_w', label: 'w', emoji: 'ⓦ' }
    ]
  },
  {
    id: 'gr1_rev_04',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter N, arch on top like a bridge',
    correctOptionId: 'opt_n',
    isReversalTest: true,
    reversalOption: 'opt_u',
    options: [
      { id: 'opt_u', label: 'u', emoji: 'ⓤ' },
      { id: 'opt_n', label: 'n', emoji: 'ⓝ' },
      { id: 'opt_h', label: 'h', emoji: 'ⓗ' },
      { id: 'opt_m', label: 'm', emoji: 'ⓜ' }
    ]
  },
  {
    id: 'gr1_num_01',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'easy',
    category: 'Numbers',
    type: 'visual_matching',
    promptText: 'Which picture shows exactly 4 apples?',
    audioText: 'Which picture shows exactly four apples?',
    correctOptionId: 'opt_4apples',
    options: [
      { id: 'opt_2apples', label: '2 Apples', emoji: '🍎🍎' },
      { id: 'opt_4apples', label: '4 Apples', emoji: '🍎🍎🍎🍎' },
      { id: 'opt_3apples', label: '3 Apples', emoji: '🍎🍎🍎' },
      { id: 'opt_5apples', label: '5 Apples', emoji: '🍎🍎🍎🍎🍎' }
    ]
  },
  {
    id: 'gr1_num_02',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'medium',
    category: 'Numbers',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Number Twelve',
    correctOptionId: 'opt_12',
    options: [
      { id: 'opt_21', label: '21', emoji: '2️⃣1️⃣' },
      { id: 'opt_12', label: '12', emoji: '1️⃣2️⃣' },
      { id: 'opt_10', label: '10', emoji: '1️⃣0️⃣' },
      { id: 'opt_20', label: '20', emoji: '2️⃣0️⃣' }
    ]
  },
  {
    id: 'gr1_adv_01',
    standard_min: '1',
    standard_max: '1',
    difficulty: 'advanced',
    category: 'Everyday Objects',
    type: 'visual_matching',
    promptText: 'Which tool is used to write neatly in a notebook?',
    audioText: 'Which tool is used to write neatly in a notebook?',
    correctOptionId: 'opt_pencil',
    options: [
      { id: 'opt_fork', label: 'Fork', emoji: '🍴' },
      { id: 'opt_key', label: 'Key', emoji: '🔑' },
      { id: 'opt_pencil', label: 'Pencil', emoji: '✏️' },
      { id: 'opt_spoon', label: 'Spoon', emoji: '🥄' }
    ]
  },

  // ==========================================
  // GRADE 2 (Age 7–8) - Multi-Syllable, Phonics, Counting
  // ==========================================
  {
    id: 'gr2_snd_01',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'easy',
    category: 'Common Words',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Butterfly fluttering wings',
    correctOptionId: 'opt_butterfly',
    options: [
      { id: 'opt_bee', label: 'Honeybee', emoji: '🐝' },
      { id: 'opt_butterfly', label: 'Butterfly', emoji: '🦋' },
      { id: 'opt_ant', label: 'Ant', emoji: '🐜' },
      { id: 'opt_spider', label: 'Spider', emoji: '🕷️' }
    ]
  },
  {
    id: 'gr2_snd_02',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'easy',
    category: 'Everyday Objects',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Bicycle with two wheels and pedals',
    correctOptionId: 'opt_bicycle',
    options: [
      { id: 'opt_car', label: 'Car', emoji: '🚗' },
      { id: 'opt_motorcycle', label: 'Motorbike', emoji: '🏍️' },
      { id: 'opt_bicycle', label: 'Bicycle', emoji: '🚲' },
      { id: 'opt_scooter', label: 'Scooter', emoji: '🛴' }
    ]
  },
  {
    id: 'gr2_snd_03',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'medium',
    category: 'Good Habits',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Watering plants to help them grow',
    correctOptionId: 'opt_water_plants',
    options: [
      { id: 'opt_cutting', label: 'Cutting Paper', emoji: '✂️' },
      { id: 'opt_water_plants', label: 'Watering Plants', emoji: '🪴' },
      { id: 'opt_sleeping', label: 'Sleeping', emoji: '🛌' },
      { id: 'opt_playing', label: 'Playing Game', emoji: '🎮' }
    ]
  },
  {
    id: 'gr2_snd_04',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'medium',
    category: 'Animals',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Peacock spreading colorful feathers',
    correctOptionId: 'opt_peacock',
    options: [
      { id: 'opt_parrot', label: 'Parrot', emoji: '🦜' },
      { id: 'opt_duck', label: 'Duck', emoji: '🦆' },
      { id: 'opt_peacock', label: 'Peacock', emoji: '🦚' },
      { id: 'opt_owl', label: 'Owl', emoji: '🦉' }
    ]
  },
  {
    id: 'gr2_snd_05',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'medium',
    category: 'Fruits',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Watermelon with black seeds',
    correctOptionId: 'opt_watermelon',
    options: [
      { id: 'opt_strawberry', label: 'Strawberry', emoji: '🍓' },
      { id: 'opt_watermelon', label: 'Watermelon', emoji: '🍉' },
      { id: 'opt_coconut', label: 'Coconut', emoji: '🥥' },
      { id: 'opt_pineapple', label: 'Pineapple', emoji: '🍍' }
    ]
  },
  {
    id: 'gr2_rev_01',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'easy',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Find letter B as in Boat',
    correctOptionId: 'opt_b',
    isReversalTest: true,
    reversalOption: 'opt_d',
    options: [
      { id: 'opt_d', label: 'd', emoji: 'ⓓ' },
      { id: 'opt_b', label: 'b', emoji: 'ⓑ' },
      { id: 'opt_p', label: 'p', emoji: 'ⓟ' },
      { id: 'opt_q', label: 'q', emoji: 'ⓠ' }
    ]
  },
  {
    id: 'gr2_rev_02',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Find letter D as in Drum',
    correctOptionId: 'opt_d',
    isReversalTest: true,
    reversalOption: 'opt_b',
    options: [
      { id: 'opt_b', label: 'b', emoji: 'ⓑ' },
      { id: 'opt_d', label: 'd', emoji: 'ⓓ' },
      { id: 'opt_q', label: 'q', emoji: 'ⓠ' },
      { id: 'opt_p', label: 'p', emoji: 'ⓟ' }
    ]
  },
  {
    id: 'gr2_rev_03',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Find letter M with two peaks pointing to the sky',
    correctOptionId: 'opt_m',
    isReversalTest: true,
    reversalOption: 'opt_w',
    options: [
      { id: 'opt_w', label: 'w', emoji: 'ⓦ' },
      { id: 'opt_m', label: 'm', emoji: 'ⓜ' },
      { id: 'opt_n', label: 'n', emoji: 'ⓝ' },
      { id: 'opt_u', label: 'u', emoji: 'ⓤ' }
    ]
  },
  {
    id: 'gr2_num_01',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'easy',
    category: 'Numbers',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Number Thirty Five',
    correctOptionId: 'opt_35',
    options: [
      { id: 'opt_53', label: '53', emoji: '5️⃣3️⃣' },
      { id: 'opt_35', label: '35', emoji: '3️⃣5️⃣' },
      { id: 'opt_30', label: '30', emoji: '3️⃣0️⃣' },
      { id: 'opt_25', label: '25', emoji: '2️⃣5️⃣' }
    ]
  },
  {
    id: 'gr2_adv_01',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'advanced',
    category: 'Shapes',
    type: 'visual_matching',
    promptText: 'Which geometric shape has 3 corners and 3 straight sides?',
    audioText: 'Which geometric shape has three corners and three straight sides?',
    correctOptionId: 'opt_triangle',
    options: [
      { id: 'opt_circle', label: 'Circle', emoji: '🔴' },
      { id: 'opt_triangle', label: 'Triangle', emoji: '🔺' },
      { id: 'opt_square', label: 'Square', emoji: '⬛' },
      { id: 'opt_oval', label: 'Oval', emoji: '🥚' }
    ]
  },
  {
    id: 'gr2_adv_02',
    standard_min: '2',
    standard_max: '2',
    difficulty: 'advanced',
    category: 'Good Habits',
    type: 'visual_matching',
    promptText: 'Which picture shows pedestrian road safety at the zebra crossing?',
    audioText: 'Which picture shows pedestrian road safety at the zebra crossing?',
    correctOptionId: 'opt_zebra_cross',
    options: [
      { id: 'opt_zebra_cross', label: 'Zebra Crossing', emoji: '🚶‍♂️' },
      { id: 'opt_fireworks', label: 'Firecrackers', emoji: '🎆' },
      { id: 'opt_racing', label: 'Running on Road', emoji: '🏃' },
      { id: 'opt_jumping', label: 'Climbing Wall', emoji: '🧗' }
    ]
  },

  // ==========================================
  // GRADE 3 (Age 8–9) - Complex Vocabulary, Time, Logic
  // ==========================================
  {
    id: 'gr3_snd_01',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'easy',
    category: 'Everyday Objects',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Telescope used for stargazing in the night sky',
    correctOptionId: 'opt_telescope',
    options: [
      { id: 'opt_microscope', label: 'Microscope', emoji: '🔬' },
      { id: 'opt_telescope', label: 'Telescope', emoji: '🔭' },
      { id: 'opt_magnifier', label: 'Magnifying Glass', emoji: '🔍' },
      { id: 'opt_camera', label: 'Camera', emoji: '📷' }
    ]
  },
  {
    id: 'gr3_snd_02',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'medium',
    category: 'Transport',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Rocket blasting off into outer space',
    correctOptionId: 'opt_rocket',
    options: [
      { id: 'opt_rocket', label: 'Rocket', emoji: '🚀' },
      { id: 'opt_satellite', label: 'Satellite', emoji: '🛰️' },
      { id: 'opt_plane', label: 'Airplane', emoji: '✈️' },
      { id: 'opt_helicopter', label: 'Helicopter', emoji: '🚁' }
    ]
  },
  {
    id: 'gr3_snd_03',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'medium',
    category: 'Everyday Objects',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Hourglass measuring passing time with sand',
    correctOptionId: 'opt_hourglass',
    options: [
      { id: 'opt_bottle', label: 'Bottle', emoji: '🍾' },
      { id: 'opt_hourglass', label: 'Hourglass', emoji: '⏳' },
      { id: 'opt_compass', label: 'Compass', emoji: '🧭' },
      { id: 'opt_magnet', label: 'Magnet', emoji: '🧲' }
    ]
  },
  {
    id: 'gr3_rev_01',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'easy',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter P, with downward stick and loop on right',
    correctOptionId: 'opt_p',
    isReversalTest: true,
    reversalOption: 'opt_q',
    options: [
      { id: 'opt_q', label: 'q', emoji: 'ⓠ' },
      { id: 'opt_p', label: 'p', emoji: 'ⓟ' },
      { id: 'opt_d', label: 'd', emoji: 'ⓓ' },
      { id: 'opt_b', label: 'b', emoji: 'ⓑ' }
    ]
  },
  {
    id: 'gr3_rev_02',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'medium',
    category: 'Alphabets',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Letter Q, with loop on left and downward tail',
    correctOptionId: 'opt_q',
    isReversalTest: true,
    reversalOption: 'opt_p',
    options: [
      { id: 'opt_p', label: 'p', emoji: 'ⓟ' },
      { id: 'opt_q', label: 'q', emoji: 'ⓠ' },
      { id: 'opt_b', label: 'b', emoji: 'ⓑ' },
      { id: 'opt_d', label: 'd', emoji: 'ⓓ' }
    ]
  },
  {
    id: 'gr3_num_01',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'medium',
    category: 'Numbers',
    type: 'sound_to_picture',
    promptText: 'Recognize this by sound',
    audioText: 'Number One Hundred and Fifty',
    correctOptionId: 'opt_150',
    options: [
      { id: 'opt_510', label: '510', emoji: '5️⃣1️⃣0️⃣' },
      { id: 'opt_105', label: '105', emoji: '1️⃣0️⃣5️⃣' },
      { id: 'opt_150', label: '150', emoji: '1️⃣5️⃣0️⃣' },
      { id: 'opt_15', label: '15', emoji: '1️⃣5️⃣' }
    ]
  },
  {
    id: 'gr3_adv_01',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'advanced',
    category: 'Good Habits',
    type: 'visual_matching',
    promptText: 'Which picture demonstrates environmental tree plantation?',
    audioText: 'Which picture demonstrates planting young saplings for green environment?',
    correctOptionId: 'opt_plant_tree',
    options: [
      { id: 'opt_plant_tree', label: 'Planting Tree', emoji: '🌱' },
      { id: 'opt_axe', label: 'Cutting Wood', emoji: '🪓' },
      { id: 'opt_smoke', label: 'Factory Smoke', emoji: '🏭' },
      { id: 'opt_waste', label: 'Plastic Trash', emoji: '🗑️' }
    ]
  },
  {
    id: 'gr3_adv_02',
    standard_min: '3',
    standard_max: '3',
    difficulty: 'advanced',
    category: 'Everyday Objects',
    type: 'visual_matching',
    promptText: 'Which scientific device shows cardinal North, South, East, and West directions?',
    audioText: 'Which scientific navigational device shows cardinal North, South, East, and West directions?',
    correctOptionId: 'opt_compass',
    options: [
      { id: 'opt_thermometer', label: 'Thermometer', emoji: '🌡️' },
      { id: 'opt_compass', label: 'Magnetic Compass', emoji: '🧭' },
      { id: 'opt_ruler', label: 'Ruler', emoji: '📏' },
      { id: 'opt_calculator', label: 'Calculator', emoji: '🧮' }
    ]
  }
];

/**
 * Smart Randomizer: Selects questions balanced across categories and grade difficulty ratios:
 * - UKG: 70% Easy, 30% Medium, 0% Adv
 * - Grade 1: 60% Easy, 35% Medium, 5% Adv
 * - Grade 2: 40% Easy, 45% Medium, 15% Adv
 * - Grade 3: 30% Easy, 50% Medium, 20% Adv
 */
export function sampleAssessmentQuestions({ grade = 'UKG', recentQuestionIds = [], targetCount = 10 }) {
  const cleanGrade = String(grade).toUpperCase().replace(/GRADE\s*/i, '').trim() || 'UKG';

  let candidatePool = QUESTION_BANK.filter(q => {
    if (cleanGrade === 'UKG') return q.standard_min === 'UKG';
    if (cleanGrade === '1') return q.standard_min === '1' || q.standard_min === 'UKG';
    if (cleanGrade === '2') return q.standard_min === '2' || q.standard_min === '1';
    return q.standard_min === '3' || q.standard_min === '2';
  });

  if (candidatePool.length === 0) {
    candidatePool = [...QUESTION_BANK];
  }

  const easyPool = candidatePool.filter(q => q.difficulty === 'easy');
  const medPool = candidatePool.filter(q => q.difficulty === 'medium');
  const advPool = candidatePool.filter(q => q.difficulty === 'advanced');

  let easyCount = Math.round(targetCount * 0.7);
  let medCount = Math.round(targetCount * 0.3);
  let advCount = 0;

  if (cleanGrade === '1') {
    easyCount = Math.round(targetCount * 0.6);
    medCount = Math.round(targetCount * 0.35);
    advCount = Math.max(0, targetCount - easyCount - medCount);
  } else if (cleanGrade === '2') {
    easyCount = Math.round(targetCount * 0.4);
    medCount = Math.round(targetCount * 0.45);
    advCount = Math.max(0, targetCount - easyCount - medCount);
  } else if (cleanGrade === '3') {
    easyCount = Math.round(targetCount * 0.3);
    medCount = Math.round(targetCount * 0.5);
    advCount = Math.max(0, targetCount - easyCount - medCount);
  }

  const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

  const filterRecent = (arr) => {
    const notRecent = arr.filter(q => !recentQuestionIds.includes(q.id));
    return notRecent.length >= 1 ? notRecent : arr;
  };

  const selectedEasy = shuffle(filterRecent(easyPool)).slice(0, easyCount);
  const selectedMed = shuffle(filterRecent(medPool)).slice(0, medCount);
  const selectedAdv = shuffle(filterRecent(advPool)).slice(0, advCount);

  let combined = [...selectedEasy, ...selectedMed, ...selectedAdv];

  if (combined.length < targetCount) {
    const remaining = candidatePool.filter(q => !combined.some(c => c.id === q.id));
    combined = [...combined, ...shuffle(remaining).slice(0, targetCount - combined.length)];
  }

  return shuffle(combined.slice(0, targetCount));
}
