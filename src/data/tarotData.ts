
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/RWS_Tarot_06_Lovers.jpg',
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
  }
];
