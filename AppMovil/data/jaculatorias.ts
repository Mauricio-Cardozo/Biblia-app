export interface JaculatoriaGroup {
  titulo: string;
  items: { invocacion: string; respuesta: string }[];
}

const DATA: JaculatoriaGroup[] = [
  {
    titulo: "A Jesucristo",
    items: [
      { invocacion: "Jesús manso y humilde de corazón,", respuesta: "haz mi corazón semejante al tuyo." },
      { invocacion: "Sagrado Corazón de Jesús,", respuesta: "en Vos confío." },
      { invocacion: "Sagrado Corazón de Jesús,", respuesta: "perdónanos y sé nuestro Rey." },
      { invocacion: "Corazón de Jesús,", respuesta: "que os ame y os haga amar." },
      { invocacion: "Corazón divino de Jesús,", respuesta: "convierte a los pecadores, salva a los moribundos, libra a las almas santas del purgatorio." },
      { invocacion: "Dulce corazón de mí Jesús,", respuesta: "haz que te ame siempre más y más." },
      { invocacion: "Sagrado Corazón de Jesús,", respuesta: "protege nuestras familias." },
      { invocacion: "En los cielos y en la tierra sea para siempre alabado,", respuesta: "el corazón amoroso de Jesús Sacramentado." },
      { invocacion: "Sea por siempre bendito y adorado Cristo, Nuestro Señor Sacramentado,", respuesta: "nuestro Rey por los siglos de los siglos." },
      { invocacion: "Alabemos y demos gracias en cada instante y momento,", respuesta: "al Santísimo y Divinísimo Sacramento." },
      { invocacion: "Acordémonos que estamos en la santa presencia de Dios,", respuesta: "¡Adorémosle!" },
      { invocacion: "¡Viva Jesús en nuestros corazones!", respuesta: "¡por siempre!" },
      { invocacion: "¡Viva Cristo Rey!", respuesta: "¡Viva!" },
      { invocacion: "Te adoramos ¡oh Cristo!, y te bendecimos,", respuesta: "porque con tu Santa Cruz redimiste al mundo." },
      { invocacion: "Alabado sea Jesucristo.", respuesta: "Por los siglos de los siglos. Amén." },
      { invocacion: "Buen Jesús, amigo de los niños,", respuesta: "bendecid a los niños de todo el mundo." },
      { invocacion: "Buen Jesús,", respuesta: "me uno a Ti de todo corazón." },
      { invocacion: "Dad, Señor, descanso eterno a las almas,", respuesta: "y la luz perpetua luzca para ellas." },
      { invocacion: "El Señor es mi pastor,", respuesta: "nada me puede faltar." },
      { invocacion: "Jesús, manso y humilde de corazón,", respuesta: "haz nuestro corazón semejante al vuestro." },
      { invocacion: "Por Ti, Jesús, vivo; por Ti, Jesús, muero;", respuesta: "tuyo soy, Jesús, en vida y en muerte, amén." },
      { invocacion: "Señor,", respuesta: "auméntanos la fe." },
      { invocacion: "Señor, Tú lo sabes todo, Tú sabes que te amo.", respuesta: "" },
      { invocacion: "Creo, Señor,", respuesta: "pero ayuda mi incredulidad." },
      { invocacion: "Jesús Dios mío,", respuesta: "os amo sobre todas las cosas." },
      { invocacion: "Jesús, mío,", respuesta: "ten misericordia de mí." },
      { invocacion: "Tuyo soy, para Ti nací,", respuesta: "¿qué quieres Jesús de mí?" },
    ],
  },
  {
    titulo: "Al Espíritu Santo",
    items: [
      { invocacion: "Espíritu Santo fuente de luz,", respuesta: "¡ilumínanos!" },
      { invocacion: "Espíritu Santo fuente de sabiduría,", respuesta: "guíanos." },
      { invocacion: "Espíritu Santo fuente de amor,", respuesta: "llénanos." },
      { invocacion: "Espíritu Santo, dulce huésped de mi alma,", respuesta: "permaneced en mí, y que yo permanezca siempre en Ti." },
    ],
  },
  {
    titulo: "A Jesús, José y María",
    items: [
      { invocacion: "Jesús, José y María,", respuesta: "os doy el corazón y el alma mía." },
      { invocacion: "Jesús, José y María,", respuesta: "asistidme en mi última agonía." },
      { invocacion: "Jesús, José y María,", respuesta: "en Vos descanse en paz el alma mía." },
    ],
  },
  {
    titulo: "A la Virgen María",
    items: [
      { invocacion: "Ave María Purísima,", respuesta: "sin pecado concebida." },
      { invocacion: "Dulce Corazón de María,", respuesta: "sed la salvación del alma mía." },
      { invocacion: "María, Madre de Gracia, Madre de Misericordia,", respuesta: "en la vida y en la muerte ampáranos gran Señora." },
      { invocacion: "Santa María de Guadalupe,", respuesta: "ruega por nosotros." },
      { invocacion: "Santa María de Guadalupe,", respuesta: "salva a nuestra patria y conserva nuestra fe." },
      { invocacion: "Santa María del buen camino,", respuesta: "haz que lleguemos sanos y salvos a nuestro destino." },
      { invocacion: "Por tu limpia concepción, ¡oh Soberana Princesa!", respuesta: "una muy grande pureza te pedimos de corazón." },
      { invocacion: "Ruega por nosotros Santa Madre de Dios,", respuesta: "para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo." },
      { invocacion: "Inmaculada reina de la paz,", respuesta: "ruega por nosotros." },
      { invocacion: "Madre de amor, de dolor y misericordia,", respuesta: "ruega por nosotros." },
      { invocacion: "Oh María sin pecado concebida,", respuesta: "ruega por nosotros que recurrimos a ti." },
      { invocacion: "Virgen, Madre de Dios, María,", respuesta: "rogad a Jesús por mí." },
      { invocacion: "Corazón dulcísimo de María,", respuesta: "prepáranos un camino seguro." },
      { invocacion: "Dulce Corazón de María,", respuesta: "sed la salvación mía." },
      { invocacion: "Purísimo Corazón de María, virgen santísima,", respuesta: "alcánzanos de Jesús la pureza y la humildad de corazón." },
    ],
  },
  {
    titulo: "A San José, los Santos, Ángeles y varias",
    items: [
      { invocacion: "Patriarca San José,", respuesta: "ruega por nosotros." },
      { invocacion: "San José mi padre y señor,", respuesta: "enséñame a querer más cada día a Jesús y María." },
      { invocacion: "Haced, San José, que vivamos una vida inocente", respuesta: "y esté siempre asegurada bajo vuestro patrocinio." },
      { invocacion: "Santos y Mártires de Cristo Rey,", respuesta: "rueguen por nosotros." },
      { invocacion: "Santísima Trinidad, un solo Dios; creo en Ti; espero en Ti, os amo y os adoro;", respuesta: "ten piedad de mí, ahora y en la hora de mi muerte, y salvadme." },
    ],
  },
];

export default DATA;
