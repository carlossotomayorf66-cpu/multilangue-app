const { pool } = require('../config/db');

const QUIZ_DATA = {
    1: {
        title: "Quiz Unité 1: Salutations & Basics",
        questions: [
            { text: "Au matin, pour saluer ton professeur, tu dis :", options: [{ t: "Bonsoir", c: 0 }, { t: "Bonjour", c: 1 }, { t: "Bonne nuit", c: 0 }, { t: "À demain", c: 0 }] },
            { text: "Tu arrives à une fête à 20h00. Tu dis :", options: [{ t: "Bonjour", c: 0 }, { t: "Bonsoir", c: 1 }, { t: "Bonne nuit", c: 0 }, { t: "Salut", c: 0 }] },
            { text: "Pierre est le ___ de Marie (hermano).", options: [{ t: "sœur", c: 0 }, { t: "cousin", c: 0 }, { t: "frère", c: 1 }, { t: "oncle", c: 0 }] },
            { text: "La mère de ta mère est ta ___.", options: [{ t: "grand-père", c: 0 }, { t: "tante", c: 0 }, { t: "grand-mère", c: 1 }, { t: "mère", c: 0 }] },
            { text: "C'est ___ livre de français.", options: [{ t: "une", c: 0 }, { t: "la", c: 0 }, { t: "un", c: 1 }, { t: "l’", c: 0 }] },
            { text: "Nous allons à ___ école.", options: [{ t: "le", c: 0 }, { t: "la", c: 0 }, { t: "l’", c: 1 }, { t: "un", c: 0 }] },
            { text: "Completar: J'aime ___ maison.", options: [{ t: "ce maison", c: 0 }, { t: "cette maison", c: 1 }, { t: "cet maison", c: 0 }, { t: "ces maison", c: 0 }] },
            { text: "Regarde ___ amis qui jouent au football.", options: [{ t: "ce amis", c: 0 }, { t: "cet amis", c: 0 }, { t: "cette amis", c: 0 }, { t: "ces amis", c: 1 }] },
            { text: "Completar: Je ___ étudiant à l'université.", options: [{ t: "ai", c: 0 }, { t: "suis", c: 1 }, { t: "es", c: 0 }, { t: "être", c: 0 }] },
            { text: "Pour dire ton âge (25 ans), tu dis :", options: [{ t: "Je suis 25 ans", c: 0 }, { t: "J’ai 25 ans", c: 1 }, { t: "Je fais 25 ans", c: 0 }, { t: "J’ai ans 25", c: 0 }] },
            { text: "Completar: Demain, Je ___ à Quito.", options: [{ t: "Je parle à Quito", c: 0 }, { t: "Je vais à Quito", c: 1 }, { t: "Je suis à Quito", c: 0 }, { t: "Je veux Quito", c: 0 }] },
            { text: "Completar: Je ___ la réponse à la question.", options: [{ t: "Je sais la réponse", c: 1 }, { t: "Je connais la réponse", c: 0 }, { t: "Je savoir la réponse", c: 0 }, { t: "Je suis la réponse", c: 0 }] },
            { text: "Completar: Je ___ étudier médecine.", options: [{ t: "Je parle étudier", c: 0 }, { t: "Je veux étudier", c: 1 }, { t: "Je vais étudier", c: 0 }, { t: "Je sais étudier", c: 0 }] },
            { text: "C'est ___ père (mi padre).", options: [{ t: "ma", c: 0 }, { t: "mon", c: 1 }, { t: "mes", c: 0 }, { t: "ton", c: 0 }] },
            { text: "Ce sont ___ sœurs (mis hermanas).", options: [{ t: "ma", c: 0 }, { t: "mon", c: 0 }, { t: "mes", c: 1 }, { t: "ses", c: 0 }] },
            { text: "Pour identifier un objet, on demande :", options: [{ t: "Est-ce que c’est ?", c: 0 }, { t: "Qu’est-ce que c’est ?", c: 1 }, { t: "Où est-ce ?", c: 0 }, { t: "Comment c’est ?", c: 0 }] },
            { text: "Pour demander si quelqu'un parle une langue :", options: [{ t: "Qu’est-ce que tu parles français ?", c: 0 }, { t: "Est-ce que tu parles français ?", c: 1 }, { t: "Tu parles est-ce français ?", c: 0 }, { t: "Pourquoi tu parles français ?", c: 0 }] },
            { text: "Pour confirmer l'identité de quelqu'un :", options: [{ t: "Qu’est-ce que c’est ton frère ?", c: 0 }, { t: "Est-ce que c’est ton frère ?", c: 1 }, { t: "Où est ton frère ?", c: 0 }, { t: "Comment est ton frère ?", c: 0 }] }
        ]
    },
    2: {
        title: "Quiz Unité 2: Questions & Daily Life",
        questions: [
            { text: "___ est-ce que tu étudies ? (Temps)", options: [{ t: "Où tu étudies ?", c: 0 }, { t: "Quand tu étudies ?", c: 1 }, { t: "Comment tu étudies ?", c: 0 }, { t: "Pourquoi tu étudies ?", c: 0 }] },
            { text: "___ est-ce que tu habites ? (Lieu)", options: [{ t: "Où tu habites ?", c: 1 }, { t: "Quand tu habites ?", c: 0 }, { t: "Comment tu habites ?", c: 0 }, { t: "Pourquoi tu habites ?", c: 0 }] },
            { text: "Pour demander l'état de quelqu'un :", options: [{ t: "Où ça va ?", c: 0 }, { t: "Comment ça va ?", c: 1 }, { t: "Quand ça va ?", c: 0 }, { t: "Pourquoi ça va ?", c: 0 }] },
            { text: "Pour demander la raison :", options: [{ t: "Quand tu étudies le français ?", c: 0 }, { t: "Où tu étudies le français ?", c: 0 }, { t: "Pourquoi tu étudies le français ?", c: 1 }, { t: "Comment tu étudies le français ?", c: 0 }] },
            { text: "Completar: J’étudie le français ___ j’aime la langue.", options: [{ t: "quand", c: 0 }, { t: "parce que", c: 1 }, { t: "où", c: 0 }, { t: "mais", c: 0 }] },
            { text: "Completar: Je ___ travailler ce week-end. (devoir)", options: [{ t: "dois", c: 1 }, { t: "devoir", c: 0 }, { t: "doit", c: 0 }, { t: "devais", c: 0 }] },
            { text: "Completar: Je ___ sortir avec mes amis.", options: [{ t: "Je peux sortir", c: 1 }, { t: "Je pouvoir sortir", c: 0 }, { t: "Je sors pouvoir", c: 0 }, { t: "Je suis sortir", c: 0 }] },
            { text: "Le soir, Je ___ la télévision.", options: [{ t: "Je vois la télévision", c: 0 }, { t: "Je regarde la télévision", c: 1 }, { t: "Je regarder la télévision", c: 0 }, { t: "Je regardes la télévision", c: 0 }] },
            { text: "En classe, je ___ le professeur.", options: [{ t: "Je regarde le professeur", c: 0 }, { t: "Je vois le professeur", c: 1 }, { t: "Je regarde le professeur voir", c: 0 }, { t: "Je vu le professeur", c: 0 }] },
            { text: "08h00, c'est ___.", options: [{ t: "le soir", c: 0 }, { t: "la nuit", c: 0 }, { t: "le matin", c: 1 }, { t: "l’après-midi", c: 0 }] },
            { text: "16h00, c'est ___.", options: [{ t: "le matin", c: 0 }, { t: "l’après-midi", c: 1 }, { t: "le soir", c: 0 }, { t: "la nuit", c: 0 }] },
            { text: "22h00, c'est ___.", options: [{ t: "le matin", c: 0 }, { t: "l’après-midi", c: 0 }, { t: "le soir", c: 1 }, { t: "à midi", c: 0 }] },
            { text: "Completar: Je ___ étudier aujourd’hui.", options: [{ t: "Je dois étudier aujourd’hui", c: 1 }, { t: "Je devoir étudier aujourd’hui", c: 0 }, { t: "Je dois étudie aujourd’hui", c: 0 }, { t: "Je étudié aujourd’hui", c: 0 }] },
            { text: "Pour demander le lieu de travail :", options: [{ t: "Où tu travailles ?", c: 1 }, { t: "Quand tu travailles ?", c: 0 }, { t: "Comment tu travailles ?", c: 0 }, { t: "Pourquoi tu travailles ?", c: 0 }] },
            { text: "Expliquer pourquoi tu travailles :", options: [{ t: "Je travaille quand j’ai besoin d’argent", c: 0 }, { t: "Je travaille parce que j’ai besoin d’argent", c: 1 }, { t: "Je travaille où j’ai besoin d’argent", c: 0 }, { t: "Je travaille mais j’ai besoin d’argent", c: 0 }] },
            { text: "Pour demander la manière d'étudier :", options: [{ t: "Où tu étudies le français ?", c: 0 }, { t: "Quand tu étudies le français ?", c: 0 }, { t: "Comment tu étudies le français ?", c: 1 }, { t: "Pourquoi tu étudies le français ?", c: 0 }] }
        ]
    },
    3: {
        title: "Quiz Unité 3: Futur Proche & Passé Récent",
        questions: [
            { text: "Completar: ___ livre préfères-tu ?", options: [{ t: "Quelle livre", c: 0 }, { t: "Quels livre", c: 0 }, { t: "Quel livre", c: 1 }, { t: "Quelles livre", c: 0 }] },
            { text: "Completar: ___ maisons sont belles.", options: [{ t: "Quel maisons", c: 0 }, { t: "Quels maisons", c: 0 }, { t: "Quelle maisons", c: 0 }, { t: "Quelles maisons", c: 1 }] },
            { text: "Futur proche: Je ___ étudier demain.", options: [{ t: "Je vais étudier", c: 1 }, { t: "J’irai étudier", c: 0 }, { t: "Je allé étudier", c: 0 }, { t: "Je vais étudié", c: 0 }] },
            { text: "Futur proche: Nous ___ sortir ce soir.", options: [{ t: "Nous sortons", c: 0 }, { t: "Nous allons sortir", c: 1 }, { t: "Nous sortir", c: 0 }, { t: "Nous sommes sortir", c: 0 }] },
            { text: "Passé récent: Je ___ de manger (hace un momento).", options: [{ t: "Je mange", c: 0 }, { t: "Je viens manger", c: 0 }, { t: "Je viens de manger", c: 1 }, { t: "J’ai mangé", c: 0 }] },
            { text: "Passé récent: Je ___ d'arriver.", options: [{ t: "Je viens arriver", c: 0 }, { t: "Je viens d’arriver", c: 1 }, { t: "J’arrive de venir", c: 0 }, { t: "Je suis arrivé", c: 0 }] },
            { text: "Savoir ou Connaître: Je ___ María.", options: [{ t: "Je sais María", c: 0 }, { t: "Je connais María", c: 1 }, { t: "Je connaître María", c: 0 }, { t: "Je connu María", c: 0 }] },
            { text: "Completar: J'___ un message à mon ami.", options: [{ t: "J’écris un message", c: 1 }, { t: "Je écrit un message", c: 0 }, { t: "J’écrire un message", c: 0 }, { t: "J’écrit un message", c: 0 }] },
            { text: "Sport: Je ___ au tennis.", options: [{ t: "Je joue au tennis", c: 1 }, { t: "Je joue à le tennis", c: 0 }, { t: "Je jouer au tennis", c: 0 }, { t: "Je joué au tennis", c: 0 }] },
            { text: "Completar: Je ___ de la maison à l'université.", options: [{ t: "Je viens de la maison", c: 1 }, { t: "Je viens à la maison", c: 0 }, { t: "Je venu de la maison", c: 0 }, { t: "Je vais de la maison", c: 0 }] },
            { text: "Completar: Je ___ avec des amis le vendredi.", options: [{ t: "Je sors avec des amis", c: 1 }, { t: "Je sortir avec des amis", c: 0 }, { t: "Je sort avec des amis", c: 0 }, { t: "Je sorti avec des amis", c: 0 }] },
            { text: "Futur proche: Je ___ écrire une lettre.", options: [{ t: "Je écris", c: 0 }, { t: "Je vais écrire", c: 1 }, { t: "J’écrirai", c: 0 }, { t: "Je vais écrite", c: 0 }] },
            { text: "Completar: ___ jour sommes-nous ?", options: [{ t: "Quelle jour", c: 0 }, { t: "Quel jour", c: 1 }, { t: "Quels jour", c: 0 }, { t: "Quelles jour", c: 0 }] },
            { text: "Completar: ___ heures as-tu cours ?", options: [{ t: "Quelle heures", c: 0 }, { t: "Quel heures", c: 0 }, { t: "Quels heures", c: 0 }, { t: "Quelles heures", c: 1 }] },
            { text: "Passé récent: Je ___ d'étudier.", options: [{ t: "Je viens étudier", c: 0 }, { t: "Je viens d’étudier", c: 1 }, { t: "J’ai étudié", c: 0 }, { t: "Je étudie", c: 0 }] }
        ]
    },
    4: {
        title: "Quiz Unité 4: La Ville & Pays",
        questions: [
            { text: "Pays: J'habite ___ France.", options: [{ t: "au France", c: 0 }, { t: "à France", c: 0 }, { t: "en France", c: 1 }, { t: "aux France", c: 0 }] },
            { text: "Pays: J'habite ___ Équateur.", options: [{ t: "en Équateur", c: 1 }, { t: "au Équateur", c: 0 }, { t: "à Équateur", c: 0 }, { t: "aux Équateur", c: 0 }] },
            { text: "Pays: Je vais ___ Espagne.", options: [{ t: "en Espagne", c: 1 }, { t: "au Espagne", c: 0 }, { t: "à Espagne", c: 0 }, { t: "aux Espagne", c: 0 }] },
            { text: "Transport: Je vais au travail ___ bus.", options: [{ t: "au bus", c: 0 }, { t: "à bus", c: 0 }, { t: "en bus", c: 1 }, { t: "dans bus", c: 0 }] },
            { text: "Transport: Je vais au parc ___ pied.", options: [{ t: "à pied", c: 1 }, { t: "en pied", c: 0 }, { t: "au pied", c: 0 }, { t: "dans pied", c: 0 }] },
            { text: "Transport: Je voyage ___ avion.", options: [{ t: "à avion", c: 0 }, { t: "au avion", c: 0 }, { t: "en avion", c: 1 }, { t: "dans avion", c: 0 }] },
            { text: "Position: Le livre est ___ la mesa (sobre).", options: [{ t: "sous", c: 0 }, { t: "sur", c: 1 }, { t: "entre", c: 0 }, { t: "devant", c: 0 }] },
            { text: "Position: Le chat est ___ la mesa (debajo).", options: [{ t: "sur", c: 0 }, { t: "sous", c: 1 }, { t: "devant", c: 0 }, { t: "entre", c: 0 }] },
            { text: "Position: La pharmacie est ___ la banque (al lado).", options: [{ t: "en face de", c: 0 }, { t: "à côté de", c: 1 }, { t: "entre", c: 0 }, { t: "derrière", c: 0 }] },
            { text: "Position: Je suis ___ Marie et Juan.", options: [{ t: "à côté de", c: 0 }, { t: "devant", c: 0 }, { t: "entre", c: 1 }, { t: "sur", c: 0 }] },
            { text: "Completar: Je ___ le métro tous les jours. (Prendre)", options: [{ t: "prend", c: 0 }, { t: "prends", c: 1 }, { t: "prenons", c: 0 }, { t: "pris", c: 0 }] },
            { text: "Completar: Je ___ un cadeau à mon ami.", options: [{ t: "Je donne un cadeau", c: 1 }, { t: "Je donner un cadeau", c: 0 }, { t: "Je donné un cadeau", c: 0 }, { t: "Je donnes un cadeau", c: 0 }] },
            { text: "Completar: J'___ le français à l'université.", options: [{ t: "J’étudie le français", c: 1 }, { t: "J’étudies le français", c: 0 }, { t: "J’étudier le français", c: 0 }, { t: "J’étudié le français", c: 0 }] },
            { text: "Transport: Je ___ dans le bus.", options: [{ t: "Je monte le bus", c: 0 }, { t: "Je monte dans le bus", c: 1 }, { t: "Je monte au bus", c: 0 }, { t: "Je monte de bus", c: 0 }] },
            { text: "Transport: Je ___ du bus au centre-ville.", options: [{ t: "Je descends du bus", c: 1 }, { t: "Je descends le bus", c: 0 }, { t: "Je descendre du bus", c: 0 }, { t: "Je descendu du bus", c: 0 }] }
        ]
    },
    5: {
        title: "Quiz Unité 5: Routine & Maison",
        questions: [
            { text: "Le matin, je me ___ à 7h00 (despertar).", options: [{ t: "Je me couche", c: 0 }, { t: "Je me réveille", c: 1 }, { t: "Je dors", c: 0 }, { t: "Je me lève", c: 0 }] },
            { text: "Ensuite, je me ___ (duchar).", options: [{ t: "Je me lave", c: 0 }, { t: "Je me douche", c: 1 }, { t: "Je me brosse", c: 0 }, { t: "Je me réveille", c: 0 }] },
            { text: "À 8h00, je ___ (desayunar).", options: [{ t: "Je prends le déjeuner", c: 0 }, { t: "Je prends le dîner", c: 0 }, { t: "Je prends le petit déjeuner", c: 1 }, { t: "Je mange le soir", c: 0 }] },
            { text: "Puis, je ___ l'université.", options: [{ t: "Je vais à l’université", c: 1 }, { t: "Je vais en université", c: 0 }, { t: "Je vais au université", c: 0 }, { t: "Je allé à université", c: 0 }] },
            { text: "Je ___ de la maison à 8h30.", options: [{ t: "Je sors de la maison", c: 1 }, { t: "Je pars à la maison", c: 0 }, { t: "Je rentre de la maison", c: 0 }, { t: "Je arrive de la maison", c: 0 }] },
            { text: "J'___ dans la classe de français.", options: [{ t: "Je sors de la classe", c: 0 }, { t: "J’entre dans la classe", c: 1 }, { t: "Je monte la classe", c: 0 }, { t: "Je descends la classe", c: 0 }] },
            { text: "Si le bus est lent, j'___ en retard.", options: [{ t: "Je pars tard", c: 0 }, { t: "J’arrive tard", c: 1 }, { t: "Je retourne tard", c: 0 }, { t: "Je reste tard", c: 0 }] },
            { text: "Le soir, je ___ chez moi.", options: [{ t: "Je retourne tard", c: 0 }, { t: "Je rentre chez moi", c: 1 }, { t: "Je arrive chez moi", c: 0 }, { t: "Je pars chez moi", c: 0 }] },
            { text: "Le dimanche, je ___ à la maison (quedarse).", options: [{ t: "Je pars chez moi", c: 0 }, { t: "Je reste chez moi", c: 1 }, { t: "Je retourne chez moi", c: 0 }, { t: "Je tombe chez moi", c: 0 }] },
            { text: "Attention ! Je ___ (caer).", options: [{ t: "Je tombe", c: 1 }, { t: "Je monte", c: 0 }, { t: "Je descends", c: 0 }, { t: "Je reste", c: 0 }] },
            { text: "Le soir, je ___ de l'université.", options: [{ t: "Je viens à l’université", c: 0 }, { t: "Je viens de l’université", c: 1 }, { t: "Je vais de l’université", c: 0 }, { t: "Je pars de l’université", c: 0 }] },
            { text: "Je ___ au travail après le déjeuner (volver).", options: [{ t: "Je pars", c: 0 }, { t: "Je reste", c: 0 }, { t: "Je retourne", c: 1 }, { t: "Je tombe", c: 0 }] },
            { text: "Heureusement, j'___ à l'heure.", options: [{ t: "J’arrive à l’heure", c: 1 }, { t: "J’arrive tard", c: 0 }, { t: "Je pars à l’heure", c: 0 }, { t: "Je reste à l’heure", c: 0 }] },
            { text: "Finalement, je me ___ à 23h00 (acostarse).", options: [{ t: "Je me lève", c: 0 }, { t: "Je me douche", c: 0 }, { t: "Je me couche", c: 1 }, { t: "Je me réveille", c: 0 }] },
            { text: "Le samedi, je ___ le soir avec des amis.", options: [{ t: "Je sors le matin", c: 0 }, { t: "Je sors l’après-midi", c: 0 }, { t: "Je sors le soir", c: 1 }, { t: "Je sors à midi", c: 0 }] }
        ]
    },
    6: {
        title: "Quiz Unité 6: Passé Composé (Avoir)",
        questions: [
            { text: "Completar: J'___ mangé une pomme ce matin.", options: [{ t: "ai", c: 1 }, { t: "as", c: 0 }, { t: "suis", c: 0 }, { t: "avoir", c: 0 }] },
            { text: "Completar: Tu as ___ le match de football ?", options: [{ t: "regardé", c: 1 }, { t: "regarder", c: 0 }, { t: "regardez", c: 0 }, { t: "regarde", c: 0 }] },
            { text: "Completar: Il ___ fini son travail à 18h.", options: [{ t: "a", c: 1 }, { t: "as", c: 0 }, { t: "est", c: 0 }, { t: "ont", c: 0 }] },
            { text: "Completar: Nous ___ écouté de la musique ensemble.", options: [{ t: "avons", c: 1 }, { t: "sommes", c: 0 }, { t: "avez", c: 0 }, { t: "ont", c: 0 }] },
            { text: "Completar: Vous avez ___ le bus numéro 5 ?", options: [{ t: "pris", c: 1 }, { t: "prendre", c: 0 }, { t: "prenez", c: 0 }, { t: "prit", c: 0 }] },
            { text: "Completar: Ils ___ étudié toute la nuit pour l'examen.", options: [{ t: "ont", c: 1 }, { t: "sont", c: 0 }, { t: "avez", c: 0 }, { t: "on", c: 0 }] },
            { text: "Completar: Elle a ___ un délicieux gâteau.", options: [{ t: "fait", c: 1 }, { t: "faire", c: 0 }, { t: "faite", c: 0 }, { t: "fais", c: 0 }] },
            { text: "Completar: J'ai ___ un mail important à Pierre.", options: [{ t: "écrit", c: 1 }, { t: "écrire", c: 0 }, { t: "écris", c: 0 }, { t: "écrite", c: 0 }] },
            { text: "Completar: Tu ___ bu du café ce matin ?", options: [{ t: "as", c: 1 }, { t: "a", c: 0 }, { t: "es", c: 0 }, { t: "être", c: 0 }] },
            { text: "Completar: Marie ___ acheté une nouvelle robe rouge.", options: [{ t: "a", c: 1 }, { t: "est", c: 0 }, { t: "as", c: 0 }, { t: "ont", c: 0 }] },
            { text: "Completar: Nous avons ___ nos amis au cinéma.", options: [{ t: "vu", c: 1 }, { t: "voir", c: 0 }, { t: "vus", c: 0 }, { t: "vois", c: 0 }] },
            { text: "Completar: Les enfants ___ joué dans le parc.", options: [{ t: "ont", c: 1 }, { t: "sont", c: 0 }, { t: "avons", c: 0 }, { t: "ont été", c: 0 }] },
            { text: "Completar: J'ai ___ la fenêtre car il fait chaud.", options: [{ t: "ouvert", c: 1 }, { t: "ouvrir", c: 0 }, { t: "ouvre", c: 0 }, { t: "ouverte", c: 0 }] },
            { text: "Completar: Vous ___ parlé avec le professeur ?", options: [{ t: "avez", c: 1 }, { t: "êtes", c: 0 }, { t: "ont", c: 0 }, { t: "avoir", c: 0 }] },
            { text: "Completar: Tu as ___ ta leçon de français ?", options: [{ t: "appris", c: 1 }, { t: "apprendre", c: 0 }, { t: "apprit", c: 0 }, { t: "apprise", c: 0 }] }
        ]
    }
};

async function populateQuizzes() {
    try {
        console.log("Starting quiz population...");

        const [french] = await pool.query("SELECT id FROM languages WHERE name LIKE '%Francés%'");
        if (!french.length) return console.log("No French language found.");
        const langId = french[0].id;

        const [courses] = await pool.query("SELECT id FROM courses WHERE language_id = ?", [langId]);
        if (!courses.length) return console.log("No French courses found.");

        for (const course of courses) {
            console.log(`Processing Course ${course.id}`);

            for (let i = 1; i <= 6; i++) {
                const data = QUIZ_DATA[i];
                if (!data) continue;

                // Find unit
                const [units] = await pool.query(`SELECT id FROM units WHERE course_id = ? AND title LIKE ?`, [course.id, `Unité ${i}%`]);
                if (!units.length) continue;

                const unitId = units[0].id; // Use first match

                // Check if quiz already exists
                const [existing] = await pool.query("SELECT id FROM activities WHERE unit_id = ? AND title = ? AND type = 'QUIZ'", [unitId, data.title]);
                if (existing.length) {
                    console.log(`  Replacing Unit ${i} quiz...`);
                    await pool.query("DELETE FROM activities WHERE id = ?", [existing[0].id]);
                }

                // Insert Activity
                const [res] = await pool.query("INSERT INTO activities (unit_id, title, description, type, max_score, due_date) VALUES (?, ?, ?, ?, ?, NOW() + INTERVAL 1 YEAR)",
                    [unitId, data.title, "Cuestionario de práctica.", "QUIZ", 100]);
                const activityId = res.insertId;

                // Insert Questions
                for (const q of data.questions) {
                    const [qRes] = await pool.query("INSERT INTO activity_questions (activity_id, question_text) VALUES (?, ?)", [activityId, q.text]);
                    const qId = qRes.insertId;

                    // Shuffle options
                    const shuffledOptions = q.options.sort(() => Math.random() - 0.5);

                    for (const opt of shuffledOptions) {
                        await pool.query("INSERT INTO activity_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
                            [qId, opt.t, opt.c]);
                    }
                }
                console.log(`  Created quiz for Unit ${i}`);
            }
        }
        console.log("Population complete.");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

populateQuizzes();
