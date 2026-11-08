-- Descripciones de las 44 stampe que estaban sin texto (2026-11-08).
-- Escritas a partir de cada ilustración y revisadas por Pato antes de subirlas.
-- Ya aplicado en producción. Sólo llena las que siguen vacías: si ella escribió
-- una desde /admin, ésa queda.
BEGIN;

UPDATE prodotti AS p
   SET description = v.description
  FROM (VALUES
  ('calatea', 'Una ragazza sdraiata su una grande foglia di calatea. «Non ho troppe piante, ho poco spazio»: per chi riempie la casa di verde.'),
  ('fasi-lunari', 'Cinque donne danzano in cerchio tra rami verdi e le fasi della luna, su un fondo blu pervinca. Un omaggio ai cicli, al corpo e al tempo che cambia.'),
  ('free', 'Una ragazza in rosso salta tra le nuvole, riflessa come in uno specchio d''acqua. Un piccolo invito a sentirsi liberi e leggeri.'),
  ('cacao', 'Una ragazza a occhi chiusi stringe una tazza fumante, tra foglie e baccelli di cacao. Il momento caldo e lento di chi si concede una pausa.'),
  ('slow-is-the-way', 'Una ragazza cammina con un guscio di lumaca come zaino, tra le grandi lettere di «Slow is the way». Per chi ha deciso di prendersela con calma.'),
  ('zuppa', 'Una ragazza con un cappello da fungo fa il bagno in una pentola di zuppa, tra zucca, verza e carote. Il comfort food d''autunno, preso alla lettera.'),
  ('pajaro', 'Un grande uccello dalle ali piumate stringe a sé una piccola ragazza, su un fondo verde petrolio. Per chi sa che a volte basta un abbraccio.'),
  ('liberta', 'Un papavero rosso su fondo giallo sole, circondato dalla scritta «Viva la libertà!». Il fiore selvatico che nasce dove vuole.'),
  ('vulcano', 'Un gruppo di amici guarda un vulcano fumante dalla cima di una montagna, sotto un cielo pieno di stelle. Per chi colleziona notti di viaggio.'),
  ('melograno', 'Una ragazza si addormenta abbracciata a un melograno, appeso a un ramo carico di frutti. Un''illustrazione calda, dai toni della terracotta.'),
  ('conchiglia', 'Una donna si raccoglie sotto una grande conchiglia azzurra, in un ovale color sabbia. Per chi ogni tanto torna nel proprio guscio.'),
  ('disco', 'Due amiche ballano sopra un vinile, sotto una pioggia di stelle su fondo lilla. «Dance your music»: ognuno ha il suo ritmo.'),
  ('working-hard', 'Un ragazzo si affaccia annoiato a una finestra tra le nuvole, con la scritta «working hard». Per le giornate in cui la testa vola altrove.'),
  ('don-t-worry-be-happy', 'Una ragazza si rilassa sdraiata su un disco in vinile, mani dietro la testa e musica nell''aria. «Don''t worry, be happy», da appendere dove serve un promemoria.'),
  ('palestine', 'Una donna tiene in mano una colomba bianca, mentre i suoi capelli diventano la bandiera palestinese. Un''illustrazione per la pace e la libertà della Palestina.'),
  ('tavolo', 'Una tavola apparecchiata con spaghetti, caprese, formaggi e olio nuovo, sotto la scritta «È prontoooo!». Il richiamo che fa correre tutti a tavola.'),
  ('lumaca', 'Una grande lumaca porta a spasso un piccolo bosco di funghi, con un omino in cima a guardare il panorama. Una storia lenta, da raccontare piano.'),
  ('luna-piena', 'Due amici accampati in un bosco di alberi chiari, sotto la luna piena. Per chi ama le notti all''aperto e le chiacchiere sotto le stelle.'),
  ('los-andes', 'Una piccola figura cammina con due alpaca in cima a colline color terra, sotto un sole rosso. Un paesaggio essenziale ispirato alle Ande.'),
  ('andino', 'Il diablo del carnevale di Jujuy, in Argentina, danza nel suo costume pieno di colori. Un omaggio alle feste del nord argentino.'),
  ('cavallo', 'Un gaucho cavalca su una giostra, tra cavalli color terra e nuvole leggere. La tradizione argentina incontra la meraviglia delle giostre.'),
  ('mermellata', 'Un barattolo di marmellata di fragole fatta in casa, con il coperchio di stoffa a righe, su una tovaglia a quadretti. Per una cucina che sa di colazione.'),
  ('yoga', 'Una donna seduta a gambe incrociate, con le mani giunte sopra la testa e il viso tra le nuvole. Un momento di calma da appendere al muro.'),
  ('vespa', 'Una ragazza in Vespa gialla, foulard al vento, passa sotto un arco affacciato sul mare. L''estate italiana in una sola immagine.'),
  ('farfalle', 'Un''ampolla di vetro piena di farfalle e falene colorate, con la scritta «Mi fai venire le farfalle nello stomaco». Una dichiarazione d''amore da regalare.'),
  ('mondo', 'Una ragazza seduta a cavalcioni su un mappamondo, tra le stelle di un cielo viola. Per chi ha il mondo in testa e la valigia sempre pronta.'),
  ('nuvola', 'Una ragazza legge rannicchiata su una nuvola, in un cielo blu pieno di stelle. Per chi si perde tra le pagine di un libro.'),
  ('albero', 'Un grande albero azzurro dagli occhi assonnati, con chiome rosa e uccellini gialli su ogni ramo. Su uno di questi, un piccolo personaggio si gode la sua ombra.'),
  ('verdure', 'Spinaci, asparagi, cavolo, carote, ravanelli, rape e porri disegnati uno per uno, con la scritta «eat local». Per una cucina che segue le stagioni e l''orto.'),
  ('cebolla', 'Una ragazza abbraccia una gigantesca cipolla rossa, sopra la scritta «I love onion». Una dichiarazione d''amore per l''ingrediente che non manca mai.'),
  ('rosso', 'Una ragazza riposa su un ramo di pomodori, tra fragole sparse su una tovaglia a quadretti azzurri. I colori e i sapori di un picnic d''estate.'),
  ('olio', 'Un uomo con la coppola versa olio nuovo su una fetta di pane, tra rami d''olivo, con la scritta «Umbria vibes». La bruschetta come rito di stagione.'),
  ('olivo', 'La raccolta delle olive tra le colline, con reti stese, scale e cesti pieni, sotto la scritta «Eat local». Un omaggio a chi raccoglie ancora a mano.'),
  ('cuore-sacro', 'Un sacro cuore rosso dagli occhi verdi, tra fiamme e raggi blu, con la scritta «Viva la vida». Un portafortuna ispirato all''arte popolare messicana.'),
  ('pizza', 'Una ragazza si addormenta abbracciata a una fetta di pizza che vola tra le nuvole, con la scritta «Pizza club». Per chi ha già la tessera.'),
  ('pasta', 'Una ragazza mangia spaghetti avvolta da un lungo filo di pasta, accanto alla scritta «My body: 60% pasta». Una verità scientifica, almeno in Italia.'),
  ('ragazza', 'Una ragazza dai capelli rossi accoglie la pioggia sotto un grande albero, scalza nell''erba, con la scritta «We''ve got to live». Un invito a vivere senza paura.'),
  ('aotunno', 'Piccoli personaggi riempiono una carriola di zucche, carote e cavoli sotto gli alberi d''autunno. Il raccolto di stagione come una festa da fare insieme.'),
  ('porto', 'Due figure salutano le navi dal molo di un porto, tra gabbiani, vento e fumo di ciminiere. Il momento degli arrivi e delle partenze.'),
  ('notting-hill', 'La vetrina blu di The Notting Hill Bookshop, con due personaggi tra gli scaffali e un lampione acceso. Ispirata al film cult «Notting Hill».'),
  ('lavatrice', 'Una guida illustrata al bucato, con temperature, programmi e piccoli trucchi. Utile da appendere in lavanderia e simpatica da regalare.'),
  ('moka', 'Una moka fumante con la scritta «Buongiorno amore». Il primo caffè della giornata, e un pensiero per chi lo condivide con te.'),
  ('dance', 'Una ragazza balla a piedi nudi su un fondo giallo senape, con la scritta «There is a dancer in you». Per ricordarsi che basta lasciarsi andare.'),
  ('fiore', 'Una piccola ragazza riposa dentro un grande papavero, con la scritta «Fiorire nel caos». Per chi trova il suo posto anche nei giorni disordinati.')
) AS v(slug, description)
 WHERE p.slug = v.slug
   AND p.categoria = 'stampe'
   AND p.description IS NULL;

COMMIT;
