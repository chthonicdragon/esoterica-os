
export interface TarotCardData {
  id: string;
  nameEn: string;
  nameRu: string;
  image: string;
  meaningUpEn: string;
  meaningUpRu: string;
  meaningRevEn: string;
  meaningRevRu: string;
}

export const TAROT_DECK: TarotCardData[] = [
  // Major Arcana
  {
    id: 'ar00',
    nameEn: 'The Fool',
    nameRu: 'Шут',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    meaningUpEn: 'Beginnings, innocence, spontaneity, a free spirit',
    meaningUpRu: 'Начало, невинность, спонтанность, свободный дух',
    meaningRevEn: 'Holding back, recklessness, risk-taking',
    meaningRevRu: 'Небрежность, риск, глупость'
  },
  {
    id: 'ar01',
    nameEn: 'The Magician',
    nameRu: 'Маг',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
    meaningUpEn: 'Manifestation, resourcefulness, power, inspired action',
    meaningUpRu: 'Манифестация, находчивость, сила, действие',
    meaningRevEn: 'Manipulation, poor planning, untapped talents',
    meaningRevRu: 'Манипуляция, плохое планирование, скрытые таланты'
  },
  {
    id: 'ar02',
    nameEn: 'The High Priestess',
    nameRu: 'Верховная Жрица',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
    meaningUpEn: 'Intuition, sacred knowledge, divine feminine, the subconscious mind',
    meaningUpRu: 'Интуиция, тайное знание, подсознание',
    meaningRevEn: 'Secrets, disconnected from intuition, withdrawal and silence',
    meaningRevRu: 'Секреты, поверхностность, игнорирование интуиции'
  },
  {
    id: 'ar03',
    nameEn: 'The Empress',
    nameRu: 'Императрица',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg',
    meaningUpEn: 'Femininity, beauty, nature, nurturing, abundance',
    meaningUpRu: 'Женственность, красота, природа, изобилие',
    meaningRevEn: 'Creative block, dependence on others',
    meaningRevRu: 'Творческий блок, зависимость от других'
  },
  {
    id: 'ar04',
    nameEn: 'The Emperor',
    nameRu: 'Император',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
    meaningUpEn: 'Authority, establishment, structure, a father figure',
    meaningUpRu: 'Власть, структура, авторитет, отцовская фигура',
    meaningRevEn: 'Domination, excessive control, lack of discipline',
    meaningRevRu: 'Тирания, жесткость, отсутствие дисциплины'
  },
  {
    id: 'ar05',
    nameEn: 'The Hierophant',
    nameRu: 'Иерофант',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg',
    meaningUpEn: 'Spiritual wisdom, religious beliefs, conformity, tradition',
    meaningUpRu: 'Духовная мудрость, традиции, обучение',
    meaningRevEn: 'Personal beliefs, freedom, challenging the status quo',
    meaningRevRu: 'Бунтарство, новые идеи, отказ от традиций'
  },
  {
    id: 'ar06',
    nameEn: 'The Lovers',
    nameRu: 'Влюбленные',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg',
    meaningUpEn: 'Love, harmony, relationships, values alignment, choices',
    meaningUpRu: 'Любовь, гармония, выбор, союз',
    meaningRevEn: 'Self-love, disharmony, imbalance, misalignment of values',
    meaningRevRu: 'Дисгармония, плохой выбор, разлад'
  },
  {
    id: 'ar07',
    nameEn: 'The Chariot',
    nameRu: 'Колесница',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
    meaningUpEn: 'Control, willpower, success, action, determination',
    meaningUpRu: 'Контроль, воля, успех, движение вперед',
    meaningRevEn: 'Self-discipline, opposition, lack of direction',
    meaningRevRu: 'Агрессия, отсутствие цели, поражение'
  },
  {
    id: 'ar08',
    nameEn: 'Strength',
    nameRu: 'Сила',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
    meaningUpEn: 'Strength, courage, persuasion, influence, compassion',
    meaningUpRu: 'Сила духа, мужество, сострадание',
    meaningRevEn: 'Inner strength, self-doubt, low energy, raw emotion',
    meaningRevRu: 'Слабость, неуверенность, страх'
  },
  {
    id: 'ar09',
    nameEn: 'The Hermit',
    nameRu: 'Отшельник',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg',
    meaningUpEn: 'Soul-searching, introspection, being alone, inner guidance',
    meaningUpRu: 'Поиск истины, одиночество, мудрость',
    meaningRevEn: 'Isolation, loneliness, withdrawal',
    meaningRevRu: 'Изоляция, изгнание, глупость'
  },
  {
    id: 'ar10',
    nameEn: 'Wheel of Fortune',
    nameRu: 'Колесо Фортуны',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg',
    meaningUpEn: 'Good luck, karma, life cycles, destiny, a turning point',
    meaningUpRu: 'Удача, карма, перемены, судьба',
    meaningRevEn: 'Bad luck, resistance to change, breaking cycles',
    meaningRevRu: 'Неудача, застой, сопротивление переменам'
  },
  {
    id: 'ar11',
    nameEn: 'Justice',
    nameRu: 'Справедливость',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg',
    meaningUpEn: 'Justice, fairness, truth, cause and effect, law',
    meaningUpRu: 'Справедливость, правда, закон, ответственность',
    meaningRevEn: 'Unfairness, lack of accountability, dishonesty',
    meaningRevRu: 'Несправедливость, ложь, безответственность'
  },
  {
    id: 'ar12',
    nameEn: 'The Hanged Man',
    nameRu: 'Повешенный',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg',
    meaningUpEn: 'Pause, surrender, letting go, new perspectives',
    meaningUpRu: 'Жертва, пауза, новый взгляд, принятие',
    meaningRevEn: 'Delays, resistance, stalling, indecision',
    meaningRevRu: 'Эгоизм, бесполезная жертва, застой'
  },
  {
    id: 'ar13',
    nameEn: 'Death',
    nameRu: 'Смерть',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg',
    meaningUpEn: 'Endings, change, transformation, transition',
    meaningUpRu: 'Трансформация, конец, перемены, переход',
    meaningRevEn: 'Resistance to change, personal transformation, inner purging',
    meaningRevRu: 'Страх перемен, застой, инерция'
  },
  {
    id: 'ar14',
    nameEn: 'Temperance',
    nameRu: 'Умеренность',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg',
    meaningUpEn: 'Balance, moderation, patience, purpose',
    meaningUpRu: 'Баланс, гармония, терпение, исцеление',
    meaningRevEn: 'Imbalance, excess, self-healing, re-alignment',
    meaningRevRu: 'Дисбаланс, крайности, нетерпение'
  },
  {
    id: 'ar15',
    nameEn: 'The Devil',
    nameRu: 'Дьявол',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg',
    meaningUpEn: 'Shadow self, attachment, addiction, restriction, sexuality',
    meaningUpRu: 'Зависимость, искушение, материализм, тень',
    meaningRevEn: 'Releasing limiting beliefs, exploring dark thoughts, detachment',
    meaningRevRu: 'Освобождение, преодоление страхов'
  },
  {
    id: 'ar16',
    nameEn: 'The Tower',
    nameRu: 'Башня',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
    meaningUpEn: 'Sudden change, upheaval, chaos, revelation, awakening',
    meaningUpRu: 'Разрушение, катастрофа, внезапные перемены, прозрение',
    meaningRevEn: 'Personal transformation, fear of change, averting disaster',
    meaningRevRu: 'Страх разрушения, избегание неизбежного'
  },
  {
    id: 'ar17',
    nameEn: 'The Star',
    nameRu: 'Звезда',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg',
    meaningUpEn: 'Hope, faith, purpose, renewal, spirituality',
    meaningUpRu: 'Надежда, вдохновение, духовность, обновление',
    meaningRevEn: 'Lack of faith, despair, self-trust, disconnection',
    meaningRevRu: 'Разочарование, пессимизм, упущенные возможности'
  },
  {
    id: 'ar18',
    nameEn: 'The Moon',
    nameRu: 'Луна',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg',
    meaningUpEn: 'Illusion, fear, anxiety, subconscious, intuition',
    meaningUpRu: 'Иллюзии, страхи, интуиция, подсознание',
    meaningRevEn: 'Release of fear, repressed emotion, inner confusion',
    meaningRevRu: 'Раскрытие тайн, ясность, преодоление страха'
  },
  {
    id: 'ar19',
    nameEn: 'The Sun',
    nameRu: 'Солнце',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    meaningUpEn: 'Positivity, fun, warmth, success, vitality',
    meaningUpRu: 'Радость, успех, энергия, ясность',
    meaningRevEn: 'Inner child, feeling down, overly optimistic',
    meaningRevRu: 'Временные трудности, эгоизм'
  },
  {
    id: 'ar20',
    nameEn: 'Judgement',
    nameRu: 'Суд',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg',
    meaningUpEn: 'Judgement, rebirth, inner calling, absolution',
    meaningUpRu: 'Возрождение, призыв, прощение, карма',
    meaningRevEn: 'Self-doubt, inner critic, ignoring the call',
    meaningRevRu: 'Сомнения, отказ от перемен, вина'
  },
  {
    id: 'ar21',
    nameEn: 'The World',
    nameRu: 'Мир',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
    meaningUpEn: 'Completion, integration, accomplishment, travel',
    meaningUpRu: 'Завершение, гармония, достижение цели, путешествие',
    meaningRevEn: 'Seeking personal closure, short-cuts, delays',
    meaningRevRu: 'Незавершенность, задержки, отсутствие гармонии'
  },
  
  // Minor Arcana - Wands
  {
    id: 'wa01',
    nameEn: 'Ace of Wands',
    nameRu: 'Туз Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Wands01.jpg',
    meaningUpEn: 'Inspiration, new opportunities, growth, potential',
    meaningUpRu: 'Вдохновение, новые возможности, рост, потенциал',
    meaningRevEn: 'Delays, lack of motivation, missed opportunities',
    meaningRevRu: 'Задержки, отсутствие мотивации, упущенные возможности'
  },
  {
    id: 'wa02',
    nameEn: 'Two of Wands',
    nameRu: 'Двойка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Wands02.jpg',
    meaningUpEn: 'Future planning, progress, decisions, discovery',
    meaningUpRu: 'Планирование будущего, прогресс, решения, открытия',
    meaningRevEn: 'Fear of unknown, lack of planning',
    meaningRevRu: 'Страх неизвестного, отсутствие плана'
  },
  {
    id: 'wa03',
    nameEn: 'Three of Wands',
    nameRu: 'Тройка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Wands03.jpg',
    meaningUpEn: 'Preparation, foresight, enterprise, expansion',
    meaningUpRu: 'Подготовка, предвидение, предприимчивость, расширение',
    meaningRevEn: 'Lack of foresight, delays, obstacles to long-term goals',
    meaningRevRu: 'Отсутствие предвидения, задержки, препятствия'
  },
  {
    id: 'wa04',
    nameEn: 'Four of Wands',
    nameRu: 'Четверка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Wands04.jpg',
    meaningUpEn: 'Celebration, joy, harmony, relaxation, homecoming',
    meaningUpRu: 'Праздник, радость, гармония, отдых, возвращение домой',
    meaningRevEn: 'Personal celebration, inner harmony, conflict with family',
    meaningRevRu: 'Личный праздник, внутренняя гармония, конфликт с семьей'
  },
  {
    id: 'wa05',
    nameEn: 'Five of Wands',
    nameRu: 'Пятерка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Wands05.jpg',
    meaningUpEn: 'Conflict, disagreements, competition, tension, diversity',
    meaningUpRu: 'Конфликт, разногласия, конкуренция, напряжение',
    meaningRevEn: 'Conflict avoidance, diversity, agreeing to disagree',
    meaningRevRu: 'Избегание конфликтов, согласие с разногласиями'
  },
  {
    id: 'wa06',
    nameEn: 'Six of Wands',
    nameRu: 'Шестерка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Wands06.jpg',
    meaningUpEn: 'Success, public recognition, progress, self-confidence',
    meaningUpRu: 'Успех, общественное признание, прогресс, уверенность в себе',
    meaningRevEn: 'Private achievement, personal definition of success, fall from grace',
    meaningRevRu: 'Личное достижение, падение с пьедестала'
  },
  {
    id: 'wa07',
    nameEn: 'Seven of Wands',
    nameRu: 'Семерка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Wands07.jpg',
    meaningUpEn: 'Challenge, competition, protection, perseverance',
    meaningUpRu: 'Вызов, конкуренция, защита, настойчивость',
    meaningRevEn: 'Exhaustion, giving up, overwhelmed',
    meaningRevRu: 'Истощение, сдача позиций, перегруженность'
  },
  {
    id: 'wa08',
    nameEn: 'Eight of Wands',
    nameRu: 'Восьмерка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Wands08.jpg',
    meaningUpEn: 'Movement, fast paced change, action, alignment',
    meaningUpRu: 'Движение, быстрые перемены, действие, выравнивание',
    meaningRevEn: 'Delays, frustration, resisting change, internal alignment',
    meaningRevRu: 'Задержки, разочарование, сопротивление переменам'
  },
  {
    id: 'wa09',
    nameEn: 'Nine of Wands',
    nameRu: 'Девятка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Tarot_Nine_of_Wands.jpg', // Wikimedia filename varies sometimes
    meaningUpEn: 'Resilience, courage, persistence, test of faith',
    meaningUpRu: 'Стойкость, мужество, настойчивость, испытание веры',
    meaningRevEn: 'Inner resources, struggle, overwhelm, defensive',
    meaningRevRu: 'Внутренние ресурсы, борьба, перегруженность, защита'
  },
  {
    id: 'wa10',
    nameEn: 'Ten of Wands',
    nameRu: 'Десятка Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Wands10.jpg',
    meaningUpEn: 'Burden, extra responsibility, hard work, completion',
    meaningUpRu: 'Бремя, лишняя ответственность, тяжелая работа, завершение',
    meaningRevEn: 'Doing it all, carrying the burden, delegation',
    meaningRevRu: 'Делать все самому, нести ношу, делегирование'
  },
  {
    id: 'wa11',
    nameEn: 'Page of Wands',
    nameRu: 'Паж Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Wands11.jpg',
    meaningUpEn: 'Inspiration, ideas, discovery, limitless potential',
    meaningUpRu: 'Вдохновение, идеи, открытия, безграничный потенциал',
    meaningRevEn: 'Newly formed ideas, redirecting energy, self-limiting beliefs',
    meaningRevRu: 'Новые идеи, перенаправление энергии, ограничивающие убеждения'
  },
  {
    id: 'wa12',
    nameEn: 'Knight of Wands',
    nameRu: 'Рыцарь Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Wands12.jpg',
    meaningUpEn: 'Energy, passion, inspired action, adventure, impulsiveness',
    meaningUpRu: 'Энергия, страсть, вдохновенное действие, приключение',
    meaningRevEn: 'Passion project, haste, scattered energy, delays',
    meaningRevRu: 'Спешка, рассеянная энергия, задержки'
  },
  {
    id: 'wa13',
    nameEn: 'Queen of Wands',
    nameRu: 'Королева Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Wands13.jpg',
    meaningUpEn: 'Courage, confidence, independence, social butterfly, determination',
    meaningUpRu: 'Мужество, уверенность, независимость, решимость',
    meaningRevEn: 'Self-respect, self-confidence, introverted, re-establish sense of self',
    meaningRevRu: 'Самоуважение, уверенность в себе, интроверсия'
  },
  {
    id: 'wa14',
    nameEn: 'King of Wands',
    nameRu: 'Король Жезлов',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Wands14.jpg',
    meaningUpEn: 'Natural-born leader, vision, entrepreneur, honor',
    meaningUpRu: 'Прирожденный лидер, видение, предприниматель, честь',
    meaningRevEn: 'Impulsiveness, haste, ruthless, high expectations',
    meaningRevRu: 'Импульсивность, спешка, беспощадность'
  },

  // Minor Arcana - Cups
  {
    id: 'cu01',
    nameEn: 'Ace of Cups',
    nameRu: 'Туз Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Cups01.jpg',
    meaningUpEn: 'Love, new relationships, compassion, creativity',
    meaningUpRu: 'Любовь, новые отношения, сострадание, творчество',
    meaningRevEn: 'Self-love, intuition, repressed emotions',
    meaningRevRu: 'Любовь к себе, интуиция, подавленные эмоции'
  },
  {
    id: 'cu02',
    nameEn: 'Two of Cups',
    nameRu: 'Двойка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Cups02.jpg',
    meaningUpEn: 'Unified love, partnership, mutual attraction',
    meaningUpRu: 'Единая любовь, партнерство, взаимное притяжение',
    meaningRevEn: 'Self-love, break-ups, disharmony, distrust',
    meaningRevRu: 'Разрыв, дисгармония, недоверие'
  },
  {
    id: 'cu03',
    nameEn: 'Three of Cups',
    nameRu: 'Тройка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Cups03.jpg',
    meaningUpEn: 'Celebration, friendship, creativity, collaborations',
    meaningUpRu: 'Праздник, дружба, творчество, сотрудничество',
    meaningRevEn: 'Independence, alone time, hardcore partying',
    meaningRevRu: 'Независимость, одиночество, разгул'
  },
  {
    id: 'cu04',
    nameEn: 'Four of Cups',
    nameRu: 'Четверка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Cups04.jpg',
    meaningUpEn: 'Meditation, contemplation, apathy, re-evaluation',
    meaningUpRu: 'Медитация, созерцание, апатия, переоценка',
    meaningRevEn: 'Retreat, withdrawal, checking in for alignment',
    meaningRevRu: 'Уединение, уход в себя, проверка целей'
  },
  {
    id: 'cu05',
    nameEn: 'Five of Cups',
    nameRu: 'Пятерка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Cups05.jpg',
    meaningUpEn: 'Regret, failure, disappointment, pessimism',
    meaningUpRu: 'Сожаление, неудача, разочарование, пессимизм',
    meaningRevEn: 'Personal setbacks, self-forgiveness, moving on',
    meaningRevRu: 'Личные неудачи, прощение себя, движение дальше'
  },
  {
    id: 'cu06',
    nameEn: 'Six of Cups',
    nameRu: 'Шестерка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Cups06.jpg',
    meaningUpEn: 'Revisiting the past, childhood memories, innocence, joy',
    meaningUpRu: 'Воспоминания, детство, невинность, радость',
    meaningRevEn: 'Living in the past, forgiveness, lacking playfulness',
    meaningRevRu: 'Жизнь в прошлом, прощение, отсутствие игривости'
  },
  {
    id: 'cu07',
    nameEn: 'Seven of Cups',
    nameRu: 'Семерка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cups07.jpg',
    meaningUpEn: 'Opportunities, choices, wishful thinking, illusion',
    meaningUpRu: 'Возможности, выбор, иллюзии, мечты',
    meaningRevEn: 'Alignment, personal values, overwhelmed by choices',
    meaningRevRu: 'Выравнивание, личные ценности, перегруженность выбором'
  },
  {
    id: 'cu08',
    nameEn: 'Eight of Cups',
    nameRu: 'Восьмерка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Cups08.jpg',
    meaningUpEn: 'Disappointment, abandonment, withdrawal, escapism',
    meaningUpRu: 'Разочарование, уход, бегство, отказ',
    meaningRevEn: 'Trying one more time, indecision, aimless drifting',
    meaningRevRu: 'Попытка еще раз, нерешительность, бесцельное блуждание'
  },
  {
    id: 'cu09',
    nameEn: 'Nine of Cups',
    nameRu: 'Девятка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Cups09.jpg',
    meaningUpEn: 'Contentment, satisfaction, gratitude, wish come true',
    meaningUpRu: 'Удовлетворение, благодарность, исполнение желаний',
    meaningRevEn: 'Inner happiness, materialism, dissatisfaction, indulgence',
    meaningRevRu: 'Внутреннее счастье, материализм, неудовлетворенность'
  },
  {
    id: 'cu10',
    nameEn: 'Ten of Cups',
    nameRu: 'Десятка Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Cups10.jpg',
    meaningUpEn: 'Divine love, blissful relationships, harmony, alignment',
    meaningUpRu: 'Божественная любовь, блаженство, гармония',
    meaningRevEn: 'Disconnection, misaligned values, struggling relationships',
    meaningRevRu: 'Разлад, несовпадение ценностей, трудности в отношениях'
  },
  {
    id: 'cu11',
    nameEn: 'Page of Cups',
    nameRu: 'Паж Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Cups11.jpg',
    meaningUpEn: 'Creative opportunities, intuitive messages, curiosity',
    meaningUpRu: 'Творческие возможности, интуитивные послания, любопытство',
    meaningRevEn: 'New ideas, doubting intuition, creative blocks',
    meaningRevRu: 'Новые идеи, сомнения в интуиции, творческие блоки'
  },
  {
    id: 'cu12',
    nameEn: 'Knight of Cups',
    nameRu: 'Рыцарь Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Cups12.jpg',
    meaningUpEn: 'Creativity, romance, charm, imagination, beauty',
    meaningUpRu: 'Творчество, романтика, шарм, воображение, красота',
    meaningRevEn: 'Overactive imagination, unrealistic, jealous, moody',
    meaningRevRu: 'Чрезмерное воображение, нереалистичность, ревность'
  },
  {
    id: 'cu13',
    nameEn: 'Queen of Cups',
    nameRu: 'Королева Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Cups13.jpg',
    meaningUpEn: 'Compassionate, caring, emotionally stable, intuitive',
    meaningUpRu: 'Сострадание, забота, эмоциональная стабильность, интуиция',
    meaningRevEn: 'Inner feelings, self-care, self-love, co-dependency',
    meaningRevRu: 'Внутренние чувства, забота о себе, созависимость'
  },
  {
    id: 'cu14',
    nameEn: 'King of Cups',
    nameRu: 'Король Кубков',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Cups14.jpg',
    meaningUpEn: 'Emotionally balanced, compassionate, diplomatic',
    meaningUpRu: 'Эмоциональный баланс, сострадание, дипломатия',
    meaningRevEn: 'Self-compassion, inner feelings, moodiness, emotional manipulation',
    meaningRevRu: 'Самосострадание, капризность, эмоциональная манипуляция'
  },

  // Minor Arcana - Swords
  {
    id: 'sw01',
    nameEn: 'Ace of Swords',
    nameRu: 'Туз Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Swords01.jpg',
    meaningUpEn: 'Breakthroughs, new ideas, mental clarity, success',
    meaningUpRu: 'Прорыв, новые идеи, ясность ума, успех',
    meaningRevEn: 'Inner clarity, re-thinking an idea, clouded judgement',
    meaningRevRu: 'Внутренняя ясность, переосмысление, затуманенное суждение'
  },
  {
    id: 'sw02',
    nameEn: 'Two of Swords',
    nameRu: 'Двойка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Swords02.jpg',
    meaningUpEn: 'Difficult decisions, weighing up options, an impasse',
    meaningUpRu: 'Трудные решения, взвешивание вариантов, тупик',
    meaningRevEn: 'Indecision, confusion, information overload, stalemate',
    meaningRevRu: 'Нерешительность, путаница, перегрузка информацией'
  },
  {
    id: 'sw03',
    nameEn: 'Three of Swords',
    nameRu: 'Тройка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Swords03.jpg',
    meaningUpEn: 'Heartbreak, emotional pain, sorrow, grief, hurt',
    meaningUpRu: 'Разбитое сердце, боль, горе, обида',
    meaningRevEn: 'Negative self-talk, releasing pain, optimism, forgiveness',
    meaningRevRu: 'Негативный диалог с собой, освобождение от боли, прощение'
  },
  {
    id: 'sw04',
    nameEn: 'Four of Swords',
    nameRu: 'Четверка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Swords04.jpg',
    meaningUpEn: 'Rest, relaxation, meditation, contemplation, recuperation',
    meaningUpRu: 'Отдых, расслабление, медитация, созерцание',
    meaningRevEn: 'Exhaustion, burn-out, deep contemplation, stagnation',
    meaningRevRu: 'Истощение, выгорание, застой'
  },
  {
    id: 'sw05',
    nameEn: 'Five of Swords',
    nameRu: 'Пятерка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Swords05.jpg',
    meaningUpEn: 'Conflict, disagreements, competition, defeat, winning at all costs',
    meaningUpRu: 'Конфликт, поражение, победа любой ценой',
    meaningRevEn: 'Reconciliation, making amends, past resentment',
    meaningRevRu: 'Примирение, исправление ошибок, обиды прошлого'
  },
  {
    id: 'sw06',
    nameEn: 'Six of Swords',
    nameRu: 'Шестерка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Swords06.jpg',
    meaningUpEn: 'Transition, change, rite of passage, releasing baggage',
    meaningUpRu: 'Переход, перемены, обряд посвящения, освобождение',
    meaningRevEn: 'Personal transition, resistance to change, unfinished business',
    meaningRevRu: 'Личный переход, сопротивление переменам, незавершенные дела'
  },
  {
    id: 'sw07',
    nameEn: 'Seven of Swords',
    nameRu: 'Семерка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Swords07.jpg',
    meaningUpEn: 'Betrayal, deception, getting away with something, stealth',
    meaningUpRu: 'Предательство, обман, хитрость',
    meaningRevEn: 'Mental challenges, breaking free, keeping secrets',
    meaningRevRu: 'Ментальные вызовы, освобождение, тайны'
  },
  {
    id: 'sw08',
    nameEn: 'Eight of Swords',
    nameRu: 'Восьмерка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Swords08.jpg',
    meaningUpEn: 'Negative thoughts, self-imposed restriction, imprisonment',
    meaningUpRu: 'Негативные мысли, самоограничение, заточение',
    meaningRevEn: 'Self-limiting beliefs, inner critic, releasing negative thoughts',
    meaningRevRu: 'Ограничивающие убеждения, внутренний критик'
  },
  {
    id: 'sw09',
    nameEn: 'Nine of Swords',
    nameRu: 'Девятка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Swords09.jpg',
    meaningUpEn: 'Anxiety, worry, fear, depression, nightmares',
    meaningUpRu: 'Тревога, беспокойство, страх, депрессия, кошмары',
    meaningRevEn: 'Inner turmoil, deep-seated fears, secrets, releasing worry',
    meaningRevRu: 'Внутреннее смятение, глубокие страхи, тайны'
  },
  {
    id: 'sw10',
    nameEn: 'Ten of Swords',
    nameRu: 'Десятка Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Swords10.jpg',
    meaningUpEn: 'Painful endings, deep wounds, betrayal, loss, crisis',
    meaningUpRu: 'Болезненный конец, глубокие раны, предательство, кризис',
    meaningRevEn: 'Recovery, regeneration, resisting an inevitable end',
    meaningRevRu: 'Восстановление, возрождение, сопротивление концу'
  },
  {
    id: 'sw11',
    nameEn: 'Page of Swords',
    nameRu: 'Паж Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swords11.jpg',
    meaningUpEn: 'New ideas, curiosity, thirst for knowledge, new ways of communicating',
    meaningUpRu: 'Новые идеи, любопытство, жажда знаний',
    meaningRevEn: 'Self-expression, all talk and no action, haphazard action',
    meaningRevRu: 'Самовыражение, пустые разговоры, хаотичные действия'
  },
  {
    id: 'sw12',
    nameEn: 'Knight of Swords',
    nameRu: 'Рыцарь Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Swords12.jpg',
    meaningUpEn: 'Ambitious, action-oriented, driven to succeed, fast-thinking',
    meaningUpRu: 'Амбициозность, действие, стремление к успеху',
    meaningRevEn: 'Restless, unfocused, impulsive, burn-out',
    meaningRevRu: 'Беспокойство, расфокусировка, импульсивность'
  },
  {
    id: 'sw13',
    nameEn: 'Queen of Swords',
    nameRu: 'Королева Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Swords13.jpg',
    meaningUpEn: 'Independent, unbiased judgement, clear boundaries, direct communication',
    meaningUpRu: 'Независимость, непредвзятость, границы, прямота',
    meaningRevEn: 'Overly-emotional, easily influenced, bitchy, cold',
    meaningRevRu: 'Чрезмерная эмоциональность, холодность, стервозность'
  },
  {
    id: 'sw14',
    nameEn: 'King of Swords',
    nameRu: 'Король Мечей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Swords14.jpg',
    meaningUpEn: 'Mental clarity, intellectual power, authority, truth',
    meaningUpRu: 'Ясность ума, интеллектуальная сила, власть, правда',
    meaningRevEn: 'Quiet power, inner truth, misuse of power, manipulation',
    meaningRevRu: 'Тихая сила, внутренняя правда, манипуляция'
  },

  // Minor Arcana - Pentacles
  {
    id: 'pe01',
    nameEn: 'Ace of Pentacles',
    nameRu: 'Туз Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Pents01.jpg',
    meaningUpEn: 'A new financial or career opportunity, manifestation, abundance',
    meaningUpRu: 'Новая возможность, манифестация, изобилие',
    meaningRevEn: 'Lost opportunity, lack of planning and foresight',
    meaningRevRu: 'Упущенная возможность, отсутствие плана'
  },
  {
    id: 'pe02',
    nameEn: 'Two of Pentacles',
    nameRu: 'Двойка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Pents02.jpg',
    meaningUpEn: 'Multiple priorities, time management, prioritization, adaptability',
    meaningUpRu: 'Приоритеты, управление временем, адаптивность',
    meaningRevEn: 'Over-committed, disorganization, reprioritization',
    meaningRevRu: 'Перегруженность, неорганизованность'
  },
  {
    id: 'pe03',
    nameEn: 'Three of Pentacles',
    nameRu: 'Тройка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Pents03.jpg',
    meaningUpEn: 'Teamwork, collaboration, learning, implementation',
    meaningUpRu: 'Командная работа, сотрудничество, обучение',
    meaningRevEn: 'Disharmony, misalignment, working alone',
    meaningRevRu: 'Дисгармония, работа в одиночку'
  },
  {
    id: 'pe04',
    nameEn: 'Four of Pentacles',
    nameRu: 'Четверка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Pents04.jpg',
    meaningUpEn: 'Saving money, security, conservatism, scarcity, control',
    meaningUpRu: 'Экономия, безопасность, контроль, дефицит',
    meaningRevEn: 'Over-spending, greed, self-protection',
    meaningRevRu: 'Траты, жадность, самозащита'
  },
  {
    id: 'pe05',
    nameEn: 'Five of Pentacles',
    nameRu: 'Пятерка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Pents05.jpg',
    meaningUpEn: 'Financial loss, poverty, lack mindset, isolation, worry',
    meaningUpRu: 'Финансовые потери, бедность, изоляция, беспокойство',
    meaningRevEn: 'Recovery from financial loss, spiritual poverty',
    meaningRevRu: 'Восстановление, духовная бедность'
  },
  {
    id: 'pe06',
    nameEn: 'Six of Pentacles',
    nameRu: 'Шестерка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Pents06.jpg',
    meaningUpEn: 'Giving, receiving, sharing wealth, generosity, charity',
    meaningUpRu: 'Дарение, получение, щедрость, благотворительность',
    meaningRevEn: 'Self-care, unpaid debt, one-sided charity',
    meaningRevRu: 'Забота о себе, неоплаченный долг'
  },
  {
    id: 'pe07',
    nameEn: 'Seven of Pentacles',
    nameRu: 'Семерка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Pents07.jpg',
    meaningUpEn: 'Long-term view, sustainable results, perseverance, investment',
    meaningUpRu: 'Долгосрочный взгляд, устойчивые результаты, инвестиции',
    meaningRevEn: 'Lack of long-term vision, limited success or reward',
    meaningRevRu: 'Отсутствие видения, ограниченный успех'
  },
  {
    id: 'pe08',
    nameEn: 'Eight of Pentacles',
    nameRu: 'Восьмерка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Pents08.jpg',
    meaningUpEn: 'Apprenticeship, repetitive tasks, mastery, skill development',
    meaningUpRu: 'Обучение, мастерство, развитие навыков',
    meaningRevEn: 'Self-development, perfectionism, misdirected activity',
    meaningRevRu: 'Саморазвитие, перфекционизм'
  },
  {
    id: 'pe09',
    nameEn: 'Nine of Pentacles',
    nameRu: 'Девятка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Pents09.jpg',
    meaningUpEn: 'Abundance, luxury, self-sufficiency, financial independence',
    meaningUpRu: 'Изобилие, роскошь, самодостаточность, независимость',
    meaningRevEn: 'Self-worth, over-investment in work, hustling',
    meaningRevRu: 'Самооценка, переработка'
  },
  {
    id: 'pe10',
    nameEn: 'Ten of Pentacles',
    nameRu: 'Десятка Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Pents10.jpg',
    meaningUpEn: 'Wealth, financial security, family, long-term success, contribution',
    meaningUpRu: 'Богатство, безопасность, семья, долгосрочный успех',
    meaningRevEn: 'The dark side of wealth, financial failure or loss',
    meaningRevRu: 'Темная сторона богатства, финансовые потери'
  },
  {
    id: 'pe11',
    nameEn: 'Page of Pentacles',
    nameRu: 'Паж Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Pents11.jpg',
    meaningUpEn: 'Manifestation, financial opportunity, skill development',
    meaningUpRu: 'Манифестация, финансовые возможности, навыки',
    meaningRevEn: 'Lack of progress, procrastination, learn from failure',
    meaningRevRu: 'Отсутствие прогресса, прокрастинация'
  },
  {
    id: 'pe12',
    nameEn: 'Knight of Pentacles',
    nameRu: 'Рыцарь Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Pents12.jpg',
    meaningUpEn: 'Hard work, productivity, routine, conservatism',
    meaningUpRu: 'Тяжелая работа, продуктивность, рутина',
    meaningRevEn: 'Self-discipline, boredom, feeling stuck, perfectionism',
    meaningRevRu: 'Самодисциплина, скука, застой'
  },
  {
    id: 'pe13',
    nameEn: 'Queen of Pentacles',
    nameRu: 'Королева Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Pents13.jpg',
    meaningUpEn: 'Nurturing, practical, providing financially, a working parent',
    meaningUpRu: 'Забота, практичность, финансовая поддержка',
    meaningRevEn: 'Financial independence, self-care, work-home conflict',
    meaningRevRu: 'Финансовая независимость, забота о себе'
  },
  {
    id: 'pe14',
    nameEn: 'King of Pentacles',
    nameRu: 'Король Пентаклей',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Pents14.jpg',
    meaningUpEn: 'Wealth, business, leadership, security, discipline, abundance',
    meaningUpRu: 'Богатство, бизнес, лидерство, безопасность',
    meaningRevEn: 'Financially inept, obsessed with wealth and status, stubborn',
    meaningRevRu: 'Финансовая некомпетентность, одержимость богатством'
  }
];
