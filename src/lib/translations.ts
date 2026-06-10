export type TranslationKey =
  // Status labels
  | "status.open" | "status.locked" | "status.live" | "status.ft"
  | "status.postponed" | "status.suspended" | "status.halftime" | "status.closed"
  // Match card
  | "match.kickoff" | "match.predCloses" | "match.predClosesShort"
  | "match.tbd" | "match.tbdAnnounced" | "match.waitingScores"
  | "match.events" | "match.inProgress" | "match.halftimeBreak"
  | "match.lockedIn" | "match.pointsAppear"
  | "match.postponedMsg" | "match.postponedDetail"
  | "match.suspendedMsg" | "match.suspendedDetail"
  | "match.matches" | "match.match"
  // Boosters
  | "booster.tikiTaka" | "booster.hatTrick" | "booster.goat"
  | "booster.tikiActive" | "booster.hatActive" | "booster.goatActive"
  | "booster.inventory" | "booster.available" | "booster.activated"
  | "booster.consumed" | "booster.activate" | "booster.remove"
  | "booster.assignedTo" | "booster.notAssigned" | "booster.consumedNote"
  // Time / groups
  | "time.today" | "time.tomorrow" | "time.opensIn" | "time.closesIn" | "time.predict"
  // Page
  | "page.tbdFixtures"
  // Predictor
  | "pred.submit" | "pred.change" | "pred.cancel" | "pred.yourPred"
  | "pred.home" | "pred.away"
  // Nav
  | "nav.predictor" | "nav.fixtures" | "nav.teams" | "nav.leaderboard" | "nav.leagues" | "nav.logout"
  // How it works
  | "hiw.title" | "hiw.p1title" | "hiw.p1body" | "hiw.p2title" | "hiw.p2body"
  | "hiw.p3title" | "hiw.p3body" | "hiw.p4title" | "hiw.p4body";

type Translations = Record<TranslationKey, string>;
type LocaleMap = Record<string, Translations>;

const t: LocaleMap = {
  "en-US": {
    "status.open": "Open", "status.locked": "Locked", "status.live": "Live",
    "status.ft": "FT", "status.postponed": "Postponed", "status.suspended": "Suspended",
    "status.halftime": "Half-time", "status.closed": "Closed",

    "match.kickoff": "Kickoff", "match.predCloses": "Prediction Closes",
    "match.predClosesShort": "Pred. Closes", "match.tbd": "TBD",
    "match.tbdAnnounced": "Kickoff time to be announced",
    "match.waitingScores": "Waiting for scores",
    "match.events": "Match Events", "match.inProgress": "Match in progress",
    "match.halftimeBreak": "Half-time break",
    "match.lockedIn": "Your prediction is locked in — wait for the final whistle.",
    "match.pointsAppear": "Your points will appear as soon as processing completes — leaderboard updates automatically.",
    "match.postponedMsg": "Match postponed",
    "match.postponedDetail": "This match has been moved to a later date. Predictions are closed.",
    "match.suspendedMsg": "Match suspended",
    "match.suspendedDetail": "This match has been suspended. Check back later for updates.",
    "match.matches": "matches", "match.match": "match",

    "booster.tikiTaka": "⚽ Tiki Taka", "booster.hatTrick": "🔥 Hat Trick Hero", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "Tiki Taka Active", "booster.hatActive": "Hat Trick Active", "booster.goatActive": "G.O.A.T Active",
    "booster.inventory": "Booster Inventory", "booster.available": "Available",
    "booster.activated": "Activated", "booster.consumed": "Consumed",
    "booster.activate": "Activate", "booster.remove": "Remove",
    "booster.assignedTo": "Assigned to", "booster.notAssigned": "Not assigned",
    "booster.consumedNote": "Consumed — match started",

    "time.today": "Today", "time.tomorrow": "Tomorrow",
    "time.opensIn": "Opens in", "time.closesIn": "Closes in", "time.predict": "Predict",

    "page.tbdFixtures": "🕘 TBD Fixtures",

    "pred.submit": "Submit Prediction", "pred.change": "Change Prediction",
    "pred.cancel": "Cancel", "pred.yourPred": "Your Prediction",
    "pred.home": "Home", "pred.away": "Away",

    "nav.predictor": "Predictor", "nav.fixtures": "Fixtures", "nav.teams": "Teams",
    "nav.leaderboard": "Leaderboard", "nav.leagues": "Leagues", "nav.logout": "Logout",

    "hiw.title": "How It Works",
    "hiw.p1title": "Predict Scores", "hiw.p1body": "Submit your score predictions up to 24 hours before each match. Window closes 1 minute before kickoff.",
    "hiw.p2title": "Earn Points", "hiw.p2body": "Exact score = 2 pts (3–0 scores 1 pt). Correct result = 1 pt. Boosters multiply your earnings.",
    "hiw.p3title": "Use Boosters", "hiw.p3body": "Tiki Taka (2×), Hat Trick Hero (3×), G.O.A.T (doubles jackpots). One per type per tournament.",
    "hiw.p4title": "Climb the Table", "hiw.p4body": "Points sync to the global leaderboard after final whistle. Compete in private leagues too.",
  },

  "hi-IN": {
    "status.open": "खुला", "status.locked": "बंद", "status.live": "लाइव",
    "status.ft": "FT", "status.postponed": "स्थगित", "status.suspended": "निलंबित",
    "status.halftime": "हाफ-टाइम", "status.closed": "बंद",

    "match.kickoff": "किकऑफ", "match.predCloses": "भविष्यवाणी बंद",
    "match.predClosesShort": "बंद होगा", "match.tbd": "TBD",
    "match.tbdAnnounced": "किकऑफ समय जल्द घोषित होगा",
    "match.waitingScores": "स्कोर की प्रतीक्षा",
    "match.events": "मैच घटनाएँ", "match.inProgress": "मैच जारी है",
    "match.halftimeBreak": "हाफ-टाइम ब्रेक",
    "match.lockedIn": "आपकी भविष्यवाणी लॉक है — अंतिम सीटी का इंतजार करें।",
    "match.pointsAppear": "प्रसंस्करण पूरा होते ही आपके पॉइंट दिखेंगे — लीडरबोर्ड स्वतः अपडेट होगा।",
    "match.postponedMsg": "मैच स्थगित",
    "match.postponedDetail": "यह मैच बाद की तारीख पर स्थानांतरित किया गया है। भविष्यवाणी बंद है।",
    "match.suspendedMsg": "मैच निलंबित",
    "match.suspendedDetail": "यह मैच निलंबित कर दिया गया है। बाद में जांचें।",
    "match.matches": "मैच", "match.match": "मैच",

    "booster.tikiTaka": "⚽ टिकी टाका", "booster.hatTrick": "🔥 हैट ट्रिक हीरो", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "टिकी टाका सक्रिय", "booster.hatActive": "हैट ट्रिक सक्रिय", "booster.goatActive": "G.O.A.T सक्रिय",
    "booster.inventory": "बूस्टर इन्वेंटरी", "booster.available": "उपलब्ध",
    "booster.activated": "सक्रिय", "booster.consumed": "उपयोग हो गया",
    "booster.activate": "सक्रिय करें", "booster.remove": "हटाएँ",
    "booster.assignedTo": "को सौंपा गया", "booster.notAssigned": "असाइन नहीं",
    "booster.consumedNote": "उपयोग हो गया — मैच शुरू हो गया",

    "time.today": "आज", "time.tomorrow": "कल",
    "time.opensIn": "खुलेगा", "time.closesIn": "बंद होगा", "time.predict": "भविष्यवाणी",

    "page.tbdFixtures": "🕘 TBD फिक्सचर",

    "pred.submit": "भविष्यवाणी दर्ज करें", "pred.change": "बदलें",
    "pred.cancel": "रद्द करें", "pred.yourPred": "आपकी भविष्यवाणी",
    "pred.home": "होम", "pred.away": "अवे",

    "nav.predictor": "प्रेडिक्टर", "nav.fixtures": "फिक्सचर", "nav.teams": "टीमें",
    "nav.leaderboard": "लीडरबोर्ड", "nav.leagues": "लीग", "nav.logout": "लॉगआउट",

    "hiw.title": "यह कैसे काम करता है",
    "hiw.p1title": "स्कोर भविष्यवाणी", "hiw.p1body": "प्रत्येक मैच से 24 घंटे पहले अपनी स्कोर भविष्यवाणी दर्ज करें। विंडो किकऑफ से 1 मिनट पहले बंद होती है।",
    "hiw.p2title": "पॉइंट कमाएँ", "hiw.p2body": "सटीक स्कोर = 2 पॉइंट (3–0 = 1 पॉइंट)। सही परिणाम = 1 पॉइंट। बूस्टर आपकी कमाई बढ़ाते हैं।",
    "hiw.p3title": "बूस्टर इस्तेमाल करें", "hiw.p3body": "टिकी टाका (2×), हैट ट्रिक हीरो (3×), G.O.A.T (जैकपॉट दोगुना)। प्रति प्रकार एक बूस्टर।",
    "hiw.p4title": "टेबल में ऊपर जाएँ", "hiw.p4body": "फाइनल व्हिसल के बाद पॉइंट लीडरबोर्ड में जुड़ते हैं। प्राइवेट लीग में भी प्रतिस्पर्धा करें।",
  },

  "es-ES": {
    "status.open": "Abierto", "status.locked": "Cerrado", "status.live": "En vivo",
    "status.ft": "FT", "status.postponed": "Aplazado", "status.suspended": "Suspendido",
    "status.halftime": "Descanso", "status.closed": "Cerrado",

    "match.kickoff": "Inicio", "match.predCloses": "Cierre de predicción",
    "match.predClosesShort": "Cierra", "match.tbd": "TBD",
    "match.tbdAnnounced": "Hora de inicio por confirmar",
    "match.waitingScores": "Esperando resultados",
    "match.events": "Eventos del partido", "match.inProgress": "Partido en curso",
    "match.halftimeBreak": "Descanso",
    "match.lockedIn": "Tu predicción está bloqueada — espera el pitido final.",
    "match.pointsAppear": "Los puntos aparecerán en cuanto se procesen — el marcador se actualiza solo.",
    "match.postponedMsg": "Partido aplazado",
    "match.postponedDetail": "Este partido se ha movido a una fecha posterior. Las predicciones están cerradas.",
    "match.suspendedMsg": "Partido suspendido",
    "match.suspendedDetail": "Este partido ha sido suspendido. Vuelve más tarde.",
    "match.matches": "partidos", "match.match": "partido",

    "booster.tikiTaka": "⚽ Tiki Taka", "booster.hatTrick": "🔥 Hat Trick Hero", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "Tiki Taka activo", "booster.hatActive": "Hat Trick activo", "booster.goatActive": "G.O.A.T activo",
    "booster.inventory": "Inventario de potenciadores", "booster.available": "Disponible",
    "booster.activated": "Activado", "booster.consumed": "Consumido",
    "booster.activate": "Activar", "booster.remove": "Quitar",
    "booster.assignedTo": "Asignado a", "booster.notAssigned": "Sin asignar",
    "booster.consumedNote": "Consumido — partido iniciado",

    "time.today": "Hoy", "time.tomorrow": "Mañana",
    "time.opensIn": "Abre en", "time.closesIn": "Cierra en", "time.predict": "Predecir",

    "page.tbdFixtures": "🕘 Partidos TBD",

    "pred.submit": "Enviar predicción", "pred.change": "Cambiar",
    "pred.cancel": "Cancelar", "pred.yourPred": "Tu predicción",
    "pred.home": "Local", "pred.away": "Visitante",

    "nav.predictor": "Predictor", "nav.fixtures": "Partidos", "nav.teams": "Equipos",
    "nav.leaderboard": "Clasificación", "nav.leagues": "Ligas", "nav.logout": "Cerrar sesión",

    "hiw.title": "Cómo funciona",
    "hiw.p1title": "Predice resultados", "hiw.p1body": "Envía tus predicciones hasta 24 horas antes de cada partido. La ventana cierra 1 minuto antes del inicio.",
    "hiw.p2title": "Gana puntos", "hiw.p2body": "Resultado exacto = 2 pts (3–0 = 1 pt). Resultado correcto = 1 pt. Los potenciadores multiplican tus ganancias.",
    "hiw.p3title": "Usa potenciadores", "hiw.p3body": "Tiki Taka (2×), Hat Trick Hero (3×), G.O.A.T (dobla jackpots). Uno por tipo por torneo.",
    "hiw.p4title": "Sube en la tabla", "hiw.p4body": "Los puntos se sincronizan al marcador global tras el pitido final. Compite también en ligas privadas.",
  },

  "fr-FR": {
    "status.open": "Ouvert", "status.locked": "Fermé", "status.live": "En direct",
    "status.ft": "FT", "status.postponed": "Reporté", "status.suspended": "Suspendu",
    "status.halftime": "Mi-temps", "status.closed": "Fermé",

    "match.kickoff": "Coup d'envoi", "match.predCloses": "Clôture des pronostics",
    "match.predClosesShort": "Clôture", "match.tbd": "TBD",
    "match.tbdAnnounced": "Heure de début à confirmer",
    "match.waitingScores": "En attente des scores",
    "match.events": "Événements du match", "match.inProgress": "Match en cours",
    "match.halftimeBreak": "Pause mi-temps",
    "match.lockedIn": "Votre pronostic est verrouillé — attendez le coup de sifflet final.",
    "match.pointsAppear": "Vos points apparaîtront dès le traitement terminé — le classement se met à jour automatiquement.",
    "match.postponedMsg": "Match reporté",
    "match.postponedDetail": "Ce match a été déplacé à une date ultérieure. Les pronostics sont fermés.",
    "match.suspendedMsg": "Match suspendu",
    "match.suspendedDetail": "Ce match a été suspendu. Revenez plus tard.",
    "match.matches": "matchs", "match.match": "match",

    "booster.tikiTaka": "⚽ Tiki Taka", "booster.hatTrick": "🔥 Hat Trick Hero", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "Tiki Taka actif", "booster.hatActive": "Hat Trick actif", "booster.goatActive": "G.O.A.T actif",
    "booster.inventory": "Inventaire des boosters", "booster.available": "Disponible",
    "booster.activated": "Activé", "booster.consumed": "Consommé",
    "booster.activate": "Activer", "booster.remove": "Retirer",
    "booster.assignedTo": "Assigné à", "booster.notAssigned": "Non assigné",
    "booster.consumedNote": "Consommé — match commencé",

    "time.today": "Aujourd'hui", "time.tomorrow": "Demain",
    "time.opensIn": "Ouvre dans", "time.closesIn": "Ferme dans", "time.predict": "Pronostiquer",

    "page.tbdFixtures": "🕘 Matchs TBD",

    "pred.submit": "Soumettre le pronostic", "pred.change": "Modifier",
    "pred.cancel": "Annuler", "pred.yourPred": "Votre pronostic",
    "pred.home": "Domicile", "pred.away": "Extérieur",

    "nav.predictor": "Pronostics", "nav.fixtures": "Matchs", "nav.teams": "Équipes",
    "nav.leaderboard": "Classement", "nav.leagues": "Ligues", "nav.logout": "Déconnexion",

    "hiw.title": "Comment ça marche",
    "hiw.p1title": "Pronostiquez", "hiw.p1body": "Soumettez vos pronostics jusqu'à 24 heures avant chaque match. La fenêtre ferme 1 minute avant le coup d'envoi.",
    "hiw.p2title": "Gagnez des points", "hiw.p2body": "Score exact = 2 pts (3–0 = 1 pt). Résultat correct = 1 pt. Les boosters multiplient vos gains.",
    "hiw.p3title": "Utilisez les boosters", "hiw.p3body": "Tiki Taka (2×), Hat Trick Hero (3×), G.O.A.T (double les jackpots). Un par type par tournoi.",
    "hiw.p4title": "Grimpez au classement", "hiw.p4body": "Les points se synchronisent après le coup de sifflet final. Participez aussi à des ligues privées.",
  },

  "pt-BR": {
    "status.open": "Aberto", "status.locked": "Fechado", "status.live": "Ao vivo",
    "status.ft": "FT", "status.postponed": "Adiado", "status.suspended": "Suspenso",
    "status.halftime": "Intervalo", "status.closed": "Fechado",

    "match.kickoff": "Início", "match.predCloses": "Encerra apostas",
    "match.predClosesShort": "Encerra", "match.tbd": "TBD",
    "match.tbdAnnounced": "Horário a confirmar",
    "match.waitingScores": "Aguardando resultado",
    "match.events": "Eventos da partida", "match.inProgress": "Partida em andamento",
    "match.halftimeBreak": "Intervalo",
    "match.lockedIn": "Seu palpite está travado — aguarde o apito final.",
    "match.pointsAppear": "Seus pontos aparecerão assim que o processamento terminar — o placar atualiza automaticamente.",
    "match.postponedMsg": "Partida adiada",
    "match.postponedDetail": "Esta partida foi transferida para outra data. Apostas encerradas.",
    "match.suspendedMsg": "Partida suspensa",
    "match.suspendedDetail": "Esta partida foi suspensa. Volte mais tarde.",
    "match.matches": "partidas", "match.match": "partida",

    "booster.tikiTaka": "⚽ Tiki Taka", "booster.hatTrick": "🔥 Hat Trick Hero", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "Tiki Taka ativo", "booster.hatActive": "Hat Trick ativo", "booster.goatActive": "G.O.A.T ativo",
    "booster.inventory": "Inventário de boosters", "booster.available": "Disponível",
    "booster.activated": "Ativado", "booster.consumed": "Consumido",
    "booster.activate": "Ativar", "booster.remove": "Remover",
    "booster.assignedTo": "Atribuído a", "booster.notAssigned": "Não atribuído",
    "booster.consumedNote": "Consumido — partida iniciada",

    "time.today": "Hoje", "time.tomorrow": "Amanhã",
    "time.opensIn": "Abre em", "time.closesIn": "Fecha em", "time.predict": "Apostar",

    "page.tbdFixtures": "🕘 Partidas TBD",

    "pred.submit": "Enviar palpite", "pred.change": "Alterar",
    "pred.cancel": "Cancelar", "pred.yourPred": "Seu palpite",
    "pred.home": "Casa", "pred.away": "Visitante",

    "nav.predictor": "Palpites", "nav.fixtures": "Partidas", "nav.teams": "Times",
    "nav.leaderboard": "Classificação", "nav.leagues": "Ligas", "nav.logout": "Sair",

    "hiw.title": "Como funciona",
    "hiw.p1title": "Preveja o placar", "hiw.p1body": "Envie seus palpites até 24 horas antes de cada partida. A janela fecha 1 minuto antes do início.",
    "hiw.p2title": "Ganhe pontos", "hiw.p2body": "Placar exato = 2 pts (3–0 = 1 pt). Resultado correto = 1 pt. Boosters multiplicam seus ganhos.",
    "hiw.p3title": "Use boosters", "hiw.p3body": "Tiki Taka (2×), Hat Trick Hero (3×), G.O.A.T (dobra jackpots). Um por tipo por torneio.",
    "hiw.p4title": "Suba na tabela", "hiw.p4body": "Pontos sincronizam após o apito final. Compita também em ligas privadas.",
  },

  "de-DE": {
    "status.open": "Offen", "status.locked": "Gesperrt", "status.live": "Live",
    "status.ft": "FT", "status.postponed": "Verschoben", "status.suspended": "Unterbrochen",
    "status.halftime": "Halbzeit", "status.closed": "Geschlossen",

    "match.kickoff": "Anstoß", "match.predCloses": "Tipp schließt",
    "match.predClosesShort": "Schließt", "match.tbd": "TBD",
    "match.tbdAnnounced": "Anstoßzeit wird noch bekannt gegeben",
    "match.waitingScores": "Warte auf Ergebnisse",
    "match.events": "Spielereignisse", "match.inProgress": "Spiel läuft",
    "match.halftimeBreak": "Halbzeitpause",
    "match.lockedIn": "Dein Tipp ist gesperrt — warte auf den Schlusspfiff.",
    "match.pointsAppear": "Deine Punkte erscheinen nach der Auswertung — die Tabelle aktualisiert sich automatisch.",
    "match.postponedMsg": "Spiel verschoben",
    "match.postponedDetail": "Dieses Spiel wurde auf ein späteres Datum verlegt. Tipps sind geschlossen.",
    "match.suspendedMsg": "Spiel unterbrochen",
    "match.suspendedDetail": "Dieses Spiel wurde unterbrochen. Bitte später wiederkommen.",
    "match.matches": "Spiele", "match.match": "Spiel",

    "booster.tikiTaka": "⚽ Tiki Taka", "booster.hatTrick": "🔥 Hat Trick Hero", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "Tiki Taka aktiv", "booster.hatActive": "Hat Trick aktiv", "booster.goatActive": "G.O.A.T aktiv",
    "booster.inventory": "Booster-Inventar", "booster.available": "Verfügbar",
    "booster.activated": "Aktiviert", "booster.consumed": "Verbraucht",
    "booster.activate": "Aktivieren", "booster.remove": "Entfernen",
    "booster.assignedTo": "Zugewiesen für", "booster.notAssigned": "Nicht zugewiesen",
    "booster.consumedNote": "Verbraucht — Spiel hat begonnen",

    "time.today": "Heute", "time.tomorrow": "Morgen",
    "time.opensIn": "Öffnet in", "time.closesIn": "Schließt in", "time.predict": "Tippen",

    "page.tbdFixtures": "🕘 TBD Spiele",

    "pred.submit": "Tipp abgeben", "pred.change": "Ändern",
    "pred.cancel": "Abbrechen", "pred.yourPred": "Dein Tipp",
    "pred.home": "Heim", "pred.away": "Auswärts",

    "nav.predictor": "Tipper", "nav.fixtures": "Spielplan", "nav.teams": "Teams",
    "nav.leaderboard": "Tabelle", "nav.leagues": "Ligen", "nav.logout": "Abmelden",

    "hiw.title": "So funktioniert es",
    "hiw.p1title": "Ergebnisse tippen", "hiw.p1body": "Gib deine Tipps bis zu 24 Stunden vor jedem Spiel ab. Das Fenster schließt 1 Minute vor dem Anstoß.",
    "hiw.p2title": "Punkte sammeln", "hiw.p2body": "Exaktes Ergebnis = 2 Pkt (3–0 = 1 Pkt). Richtiges Ergebnis = 1 Pkt. Booster multiplizieren deine Punkte.",
    "hiw.p3title": "Booster einsetzen", "hiw.p3body": "Tiki Taka (2×), Hat Trick Hero (3×), G.O.A.T (Jackpots verdoppeln). Einer pro Typ pro Turnier.",
    "hiw.p4title": "Aufsteigen", "hiw.p4body": "Punkte werden nach dem Schlusspfiff in die globale Tabelle übernommen. Tritt auch privaten Ligen bei.",
  },

  "ar-SA": {
    "status.open": "مفتوح", "status.locked": "مغلق", "status.live": "مباشر",
    "status.ft": "انتهت", "status.postponed": "مؤجل", "status.suspended": "موقوف",
    "status.halftime": "استراحة", "status.closed": "مغلق",

    "match.kickoff": "الانطلاق", "match.predCloses": "إغلاق التوقعات",
    "match.predClosesShort": "يغلق", "match.tbd": "TBD",
    "match.tbdAnnounced": "سيُعلن عن موعد المباراة لاحقًا",
    "match.waitingScores": "بانتظار النتائج",
    "match.events": "أحداث المباراة", "match.inProgress": "المباراة جارية",
    "match.halftimeBreak": "استراحة منتصف الوقت",
    "match.lockedIn": "توقعك مقفل — انتظر الصافرة النهائية.",
    "match.pointsAppear": "ستظهر نقاطك فور اكتمال المعالجة — يتحدث الترتيب تلقائيًا.",
    "match.postponedMsg": "المباراة مؤجلة",
    "match.postponedDetail": "تم تأجيل هذه المباراة إلى تاريخ لاحق. التوقعات مغلقة.",
    "match.suspendedMsg": "المباراة موقوفة",
    "match.suspendedDetail": "تم إيقاف هذه المباراة. تحقق لاحقًا.",
    "match.matches": "مباريات", "match.match": "مباراة",

    "booster.tikiTaka": "⚽ تيكي تاكا", "booster.hatTrick": "🔥 هاتريك بطل", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "تيكي تاكا نشط", "booster.hatActive": "هاتريك نشط", "booster.goatActive": "G.O.A.T نشط",
    "booster.inventory": "مخزون المعززات", "booster.available": "متاح",
    "booster.activated": "مُفعَّل", "booster.consumed": "مستهلك",
    "booster.activate": "تفعيل", "booster.remove": "إزالة",
    "booster.assignedTo": "مُعيَّن لـ", "booster.notAssigned": "غير معيَّن",
    "booster.consumedNote": "مستهلك — بدأت المباراة",

    "time.today": "اليوم", "time.tomorrow": "غدًا",
    "time.opensIn": "يفتح خلال", "time.closesIn": "يغلق خلال", "time.predict": "توقَّع",

    "page.tbdFixtures": "🕘 مباريات TBD",

    "pred.submit": "إرسال التوقع", "pred.change": "تعديل",
    "pred.cancel": "إلغاء", "pred.yourPred": "توقعك",
    "pred.home": "الفريق المضيف", "pred.away": "الفريق الضيف",

    "nav.predictor": "التوقعات", "nav.fixtures": "المباريات", "nav.teams": "الفرق",
    "nav.leaderboard": "الترتيب", "nav.leagues": "الدوريات", "nav.logout": "خروج",

    "hiw.title": "كيف يعمل؟",
    "hiw.p1title": "توقَّع النتائج", "hiw.p1body": "أرسل توقعاتك قبل 24 ساعة من كل مباراة. تُغلق النافذة قبل دقيقة من الانطلاق.",
    "hiw.p2title": "اكسب نقاطًا", "hiw.p2body": "نتيجة دقيقة = 2 نقطة (3–0 = 1 نقطة). نتيجة صحيحة = 1 نقطة. المعززات تضاعف أرباحك.",
    "hiw.p3title": "استخدم المعززات", "hiw.p3body": "تيكي تاكا (2×)، هاتريك بطل (3×)، G.O.A.T (يضاعف الجوائز). معزز واحد من كل نوع لكل بطولة.",
    "hiw.p4title": "تسلَّق الترتيب", "hiw.p4body": "تتزامن النقاط مع الترتيب العالمي بعد الصافرة النهائية. تنافس في الدوريات الخاصة أيضًا.",
  },

  "ja-JP": {
    "status.open": "受付中", "status.locked": "締切", "status.live": "ライブ",
    "status.ft": "終了", "status.postponed": "延期", "status.suspended": "中断",
    "status.halftime": "ハーフタイム", "status.closed": "締切",

    "match.kickoff": "キックオフ", "match.predCloses": "予想締切",
    "match.predClosesShort": "締切", "match.tbd": "TBD",
    "match.tbdAnnounced": "キックオフ時間は後日発表",
    "match.waitingScores": "スコア待ち",
    "match.events": "試合イベント", "match.inProgress": "試合中",
    "match.halftimeBreak": "ハーフタイム休憩",
    "match.lockedIn": "予想がロックされました — 終了の笛を待ちましょう。",
    "match.pointsAppear": "処理完了後にポイントが表示されます — リーダーボードは自動更新されます。",
    "match.postponedMsg": "試合延期",
    "match.postponedDetail": "この試合は後日に変更されました。予想は締め切られています。",
    "match.suspendedMsg": "試合中断",
    "match.suspendedDetail": "この試合は中断されました。後ほど確認してください。",
    "match.matches": "試合", "match.match": "試合",

    "booster.tikiTaka": "⚽ ティキタカ", "booster.hatTrick": "🔥 ハットトリックヒーロー", "booster.goat": "🐐 G.O.A.T",
    "booster.tikiActive": "ティキタカ有効", "booster.hatActive": "ハットトリック有効", "booster.goatActive": "G.O.A.T有効",
    "booster.inventory": "ブースターインベントリ", "booster.available": "利用可能",
    "booster.activated": "有効", "booster.consumed": "使用済み",
    "booster.activate": "有効化", "booster.remove": "削除",
    "booster.assignedTo": "割り当て先", "booster.notAssigned": "未割り当て",
    "booster.consumedNote": "使用済み — 試合開始",

    "time.today": "今日", "time.tomorrow": "明日",
    "time.opensIn": "開始まで", "time.closesIn": "締切まで", "time.predict": "予想",

    "page.tbdFixtures": "🕘 TBD 試合",

    "pred.submit": "予想を送信", "pred.change": "変更",
    "pred.cancel": "キャンセル", "pred.yourPred": "あなたの予想",
    "pred.home": "ホーム", "pred.away": "アウェイ",

    "nav.predictor": "予想", "nav.fixtures": "試合日程", "nav.teams": "チーム",
    "nav.leaderboard": "順位表", "nav.leagues": "リーグ", "nav.logout": "ログアウト",

    "hiw.title": "使い方",
    "hiw.p1title": "スコアを予想", "hiw.p1body": "各試合の24時間前まで予想を送信できます。ウィンドウはキックオフ1分前に閉じます。",
    "hiw.p2title": "ポイントを獲得", "hiw.p2body": "スコア的中 = 2pt (3-0は1pt)。結果的中 = 1pt。ブースターで倍増。",
    "hiw.p3title": "ブースターを使う", "hiw.p3body": "ティキタカ(2×)、ハットトリックヒーロー(3×)、G.O.A.T(ジャックポット2倍)。1大会1種類1回。",
    "hiw.p4title": "順位を上げる", "hiw.p4body": "終了の笛後にポイントが反映されます。プライベートリーグでも競い合えます。",
  },
};

// Fallback to en-US for any missing key
export function getT(locale: string): (key: TranslationKey) => string {
  const lang = locale.split("-")[0];
  const dict =
    t[locale] ??
    Object.entries(t).find(([k]) => k.split("-")[0] === lang)?.[1] ??
    t["en-US"];
  return (key: TranslationKey) => dict[key] ?? t["en-US"][key] ?? key;
}
