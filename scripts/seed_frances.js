const db = require('../config/db');

const answerKeyStr = `1 b | 2 c | 3 b | 4 c | 5 b | 6 c | 7 d | 8 b | 9 a | 10 b |
11 b | 12 c |
13 c | 14 b | 15 a | 16 c | 17 b | 18 a | 19 a | 20 c |
21 b | 22 a | 23 b | 24 a |
25 c | 26 b | 27 b | 28 b | 29 a | 30 b |
31 a | 32 a | 33 b | 34 b | 35 c | 36 d |
37 b | 38 a | 39 a | 40 a | 41 a | 42 a |
43 a | 44 b | 45 a | 46 a | 47 b | 48 a |
49 a | 50 c | 51 a | 52 c | 53 a | 54 c |
55 a | 56 c | 57 a | 58 a | 59 a | 60 b`;

const rawQuestions = [
    {
        q: '¿Cuál es la forma correcta de decir en francés “Me llamo Carlos”?',
        opts: ['Je suis Carlos', 'Je m’appelle Carlos', 'J’appelle Carlos', 'Moi Carlos']
    },
    {
        q: '¿Cuál es la traducción correcta de “Buenos días”?',
        opts: ['Bonsoir', 'Bonne nuit', 'Bonjour', 'Salut nuit']
    },
    {
        q: 'Completa correctamente según el español “Yo soy estudiante”:\nJe ___ étudiant.',
        opts: ['es', 'suis', 'ai', 'être']
    },
    {
        q: 'Traduce correctamente “Vivimos en Cuenca”:\nNous ___ à Cuenca.',
        opts: ['habite', 'habitez', 'habitons', 'habitent']
    },
    {
        q: 'En francés, “Él tiene 18 años” se expresa como:',
        opts: ['Il est 18 ans', 'Il a 18 ans', 'Il fait 18 ans', 'Il a ans 18']
    },
    {
        q: '¿Qué artículo corresponde a “escuela” en francés?\n___ école',
        opts: ['le', 'la', 'l’', 'un']
    },
    {
        q: 'Forma más formal de “muchas gracias”:',
        opts: ['Merci', 'Merci bien', 'Merci beaucoup', 'Merci infiniment']
    },
    {
        q: '“Tú hablas francés” se traduce como:',
        opts: ['Tu parle français', 'Tu parles français', 'Tu parlez français', 'Tu parlons français']
    },
    {
        q: 'Femenino correcto de “petit” (pequeño):',
        opts: ['petite', 'petits', 'petites', 'petitte']
    },
    {
        q: '“Hay un libro sobre la mesa”:\nIl y a ___ livre sur la table.',
        opts: ['une', 'un', 'des', 'du']
    },
    {
        q: '¿Cuál es correcta según el uso del español?',
        opts: ['Je suis 20 ans', 'J’ai 20 ans', 'Je fais 20 ans', 'J’ai ans 20']
    },
    {
        q: 'Traducción correcta de “Hasta mañana”:',
        opts: ['À bientôt', 'À hier', 'À demain', 'À tout à l’heure']
    },
    {
        q: '“Ayer fuimos al cine”:\nHier, nous ___ au cinéma.',
        opts: ['allons', 'allions', 'sommes allés', 'irons']
    },
    {
        q: '“Ella habla inglés o francés” (exclusión):\nElle parle ___ anglais ___ français.',
        opts: ['et / et', 'ou / ou', 'ni / ni', 'soit / soit']
    },
    {
        q: '“Hace calor hoy”:\nIl fait ___.',
        opts: ['chaud', 'chaleur', 'chaudement', 'chauffer']
    },
    {
        q: '“Busco un hotel barato”:\nJe cherche ___ hôtel pas trop cher.',
        opts: ['le', 'la', 'un', 'des']
    },
    {
        q: '“¿Prefieres el té o el café?”\nTu préfères le thé ___ le café ?',
        opts: ['que', 'ou', 'et', 'donc']
    },
    {
        q: '“Hemos comido bien”:\nNous avons ___ mangé.',
        opts: ['bien', 'bon', 'bonne', 'bons']
    },
    {
        q: '“Ella es más alta que yo”:\nElle est ___ que moi.',
        opts: ['plus grande', 'très grande', 'grande plus', 'grande']
    },
    {
        q: '“Trabaja en un banco”:\nIl travaille ___ une banque.',
        opts: ['à', 'en', 'dans', 'sur']
    },
    {
        q: 'Antónimo de “fácil”:',
        opts: ['lent', 'difficile', 'dur', 'mauvais']
    },
    {
        q: '“Debo terminar este trabajo”:\nJe ___ finir ce travail.',
        opts: ['dois', 'peux', 'veux', 'sais']
    },
    {
        q: '“Tenemos que salir temprano”:\nNous ___ partir tôt.',
        opts: ['faut', 'devons', 'êtes', 'ont']
    },
    {
        q: 'Forma correcta:',
        opts: ['Il y a beaucoup de gens', 'Il y a beaucoup des gens', 'Il y a des beaucoup gens', 'Il y a gens beaucoup']
    },
    {
        q: '“Si tuviera más tiempo, viajaría”:\nSi j’___ plus de temps, je voyagerais.',
        opts: ['ai', 'aurai', 'avais', 'ai eu']
    },
    {
        q: '“Aunque sea tarde…”\nBien qu’il ___ tard…',
        opts: ['est', 'soit', 'était', 'sera']
    },
    {
        q: '“La película que vi ayer”:\nC’est le film ___ j’ai vu hier.',
        opts: ['qui', 'que', 'dont', 'où']
    },
    {
        q: '“Ella se dio cuenta del error”:\nElle s’est ___ compte de l’erreur.',
        opts: ['rendue', 'rendu', 'rend', 'rendre']
    },
    {
        q: '“Habla demasiado rápido”:\nIl parle ___ rapidement.',
        opts: ['trop', 'très', 'assez', 'tellement']
    },
    {
        q: '“Me pregunto si vendrá”:\nJe me demande ___ il viendra.',
        opts: ['que', 'si', 'pourquoi', 'comment']
    },
    {
        q: 'Voz pasiva correcta:\nCette décision ___ importante.',
        opts: ['a été prise', 'est prise', 'était prise', 'sera pris']
    },
    {
        q: '“Se fue sin despedirse”:\nIl est parti ___ dire au revoir.',
        opts: ['sans', 'avant', 'pour', 'afin']
    },
    {
        q: '“Cuanto más trabajas, mejor tienes éxito”:\nPlus tu travailles, ___ tu réussis.',
        opts: ['plus', 'mieux', 'moins', 'meilleur']
    },
    {
        q: '“Tiene miedo de hablar en público”:\nElle a peur ___ parler en public.',
        opts: ['à', 'de', 'pour', 'avec']
    },
    {
        q: '“Es necesario que prestes atención”:\nIl faut que tu ___ attention.',
        opts: ['fais', 'fait', 'fasses', 'feras']
    },
    {
        q: '“Alguien en quien confío”:\nC’est quelqu’un ___ je fais confiance.',
        opts: ['que', 'qui', 'dont', 'à qui']
    },
    {
        q: 'Correcto:',
        opts: ['Malgré il pleut', 'Malgré la pluie', 'Malgré qu’il pleut', 'Malgré pleuvoir']
    },
    {
        q: '“Se expresa con claridad”:\nIl s’exprime avec ___.',
        opts: ['clarté', 'clair', 'clairement', 'éclair']
    },
    {
        q: '“Se supone que vive en París”:\nElle ___ habiter à Paris.',
        opts: ['est censée', 'est sensée', 'est pensée', 'est sentée']
    },
    {
        q: '“Poco conocida”:\nCette œuvre est ___ connue.',
        opts: ['peu', 'petite', 'bas', 'faible']
    },
    {
        q: '“Gracias a sus esfuerzos”:\nIl a réussi ___ ses efforts.',
        opts: ['grâce à', 'à cause de', 'malgré', 'pour']
    },
    {
        q: '“No he entendido nada”:\nJe n’ai ___ compris.',
        opts: ['rien', 'jamais', 'personne', 'aucun']
    },
    {
        q: '“Se trata de comprender”:\nIl s’agit ___ comprendre.',
        opts: ['de', 'à', 'pour', 'en']
    },
    {
        q: '“Aunque esté cansado”:\nQuoiqu’il ___ fatigué…',
        opts: ['est', 'soit', 'était', 'sera']
    },
    {
        q: '“Merece ser examinada”:\nCette hypothèse mérite ___ examinée.',
        opts: ['d’être', 'être', 'à être', 'pour être']
    },
    {
        q: '“Está lejos de haber terminado”:\nIl est loin ___ avoir terminé.',
        opts: ['de', 'à', 'pour', 'en']
    },
    {
        q: '“Carecía de coherencia”:\nSon discours manquait de ___.',
        opts: ['cohérent', 'cohérence', 'cohérentement', 'cohérer']
    },
    {
        q: '“Habló usando metáforas”:\nElle a parlé ___ métaphores.',
        opts: ['en', 'avec', 'par', 'de']
    },
    {
        q: '“Altamente discutible”:\nCe raisonnement est ___ discutable.',
        opts: ['fortement', 'fort', 'fortemente', 'fortifié']
    },
    {
        q: '“En contra de toda expectativa”:\nIl a agi ___ toute attente.',
        opts: ['contre', 'malgré', 'en dépit de', 'face à']
    },
    {
        q: '“Lejos de simplificar”:\nLoin de ___ simplifier…',
        opts: ['se', 'lui', 'en', 'y']
    },
    {
        q: '“Se inscribe en la tradición”:\nCette œuvre s’inscrit ___ la tradition.',
        opts: ['en', 'à', 'dans', 'sur']
    },
    {
        q: '“Conviene precisar”:\nIl convient ___ préciser.',
        opts: ['de', 'à', 'pour', 'en']
    },
    {
        q: '“Sean cuales sean las circunstancias”:\nPeu ___ les circonstances…',
        opts: ['sont', 'étaient', 'importent', 'importer']
    },
    {
        q: '“Demostró sangre fría”:\nIl a fait preuve ___ sang-froid.',
        opts: ['de', 'à', 'en', 'avec']
    },
    {
        q: '“Su actitud deja perplejo”:\nSon attitude laisse ___.',
        opts: ['rendre', 'devenir', 'rester', 'faire']
    },
    {
        q: '“No está exenta de consecuencias”:\nCette décision n’est pas ___ conséquence.',
        opts: ['sans', 'avec', 'de', 'à']
    },
    {
        q: '“Sin matices”:\nIl s’exprime ___ nuance.',
        opts: ['sans', 'à', 'en', 'par']
    },
    {
        q: '“Lejos de ser ideal”:\nCette solution est loin ___ idéale.',
        opts: ['de', 'à', 'pour', 'en']
    },
    {
        q: 'Forma más elegante en francés (como en español formal):',
        opts: ['Il a expliqué clairement', 'Il a donné une explication claire', 'Il a expliqué de manière claire', 'Il a clarifié l’explication']
    }
];

// Parser de respuestas
const answersMap = {};
answerKeyStr.split('|').forEach(pair => {
    // Clean up
    let [num, ans] = pair.replace(/\n/g, '').trim().split(/\s+/);
    if (!ans) { // handle edge case of newline split
        const parts = pair.trim().split(/\s+/);
        if (parts.length >= 2) { num = parts[0]; ans = parts[1]; }
    }
    if (num && ans) {
        answersMap[parseInt(num)] = ans.toLowerCase();
    }
});
// Special fix for line breaks in original string if any logic missed
// Better regex approach:
const regex = /(\d+)\s+([a-d])/g;
let match;
while ((match = regex.exec(answerKeyStr)) !== null) {
    answersMap[parseInt(match[1])] = match[2];
}


const seed = async () => {
    try {
        // 1. Create Test
        const [res] = await db.pool.query('INSERT INTO placement_tests (language, title, description) VALUES (?, ?, ?)',
            ['Francés', 'Evaluación de Nivel A1-C1', 'Prueba completa para determinar tu nivel de francés. Contesta todas las preguntas.']);

        const testId = res.insertId;
        console.log(`Test creado con ID: ${testId}`);

        // 2. Insert Questions
        for (let i = 0; i < rawQuestions.length; i++) {
            const item = rawQuestions[i];
            const qNum = i + 1;
            const correctLetter = answersMap[qNum]; // 'a', 'b', 'c', 'd'

            // Map letter to index
            const correctIndex = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 }[correctLetter];

            if (correctIndex === undefined) {
                console.warn(`⚠️ No se encontró respuesta para la pregunta ${qNum}, saltando...`);
                continue;
            }

            const [qRes] = await db.pool.query('INSERT INTO placement_questions (test_id, question_text) VALUES (?, ?)',
                [testId, item.q]);
            const qId = qRes.insertId;

            // 3. Insert Options
            for (let j = 0; j < item.opts.length; j++) {
                const isCorrect = (j === correctIndex);
                await db.pool.query('INSERT INTO placement_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                    [qId, item.opts[j], isCorrect]);
            }
        }

        console.log('✅ Cuestionario de Francés importado correctamente.');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
