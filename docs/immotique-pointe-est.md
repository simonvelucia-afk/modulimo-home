# Immotique et bâtiment Modulimo — applicabilité et leviers économiques

**Objet.** Évaluer si l'immotique (pilotage automatisé du *bâtiment*, par
opposition à la domotique du *logement*) s'applique au modèle Modulimo, et
identifier les leviers économiques réellement attirants pour la clientèle —
ceux qui font baisser une dépense que le ménage paie déjà, pas ceux qui
ajoutent un gadget.

**Périmètre de référence.** Pointe Est : **5 logements autorisés sur 3 étages,
la sixième unité étant aménagée en salle commune avec possibilité de conversion
en logement plus tard**,
construction industrialisée, **5 cases de stationnement — 3 au sous-sol pour la
flotte partagée, 1 case visiteur et 1 case louée à un résident en cour avant**
(version de projet la plus récente), toit végétalisé avec
panneaux photovoltaïques, forêt nourricière, propriétaire-occupant, CoHabitat
opérationnel à la livraison.
Concept préliminaire en cheminement PPCMOI — les caractéristiques finales
sont à arrêter avec l'architecte mandaté.

Deux questions ajoutées en cours de travail sont traitées en §10 et §11 :
la page Sécurité de modulimo.com peut-elle s'orienter vers l'immotique, et
est-il pertinent de développer CoHabitat comme un *Building Management System*
en réseau fermé avec option VPN.

**Statut du document.** Analyse interne préparatoire. Les montants cités sont
des ordres de grandeur destinés à hiérarchiser des décisions, pas des
engagements : ils doivent être validés auprès des programmes concernés, d'un
électricien (CMEQ), de l'assureur et du conseil juridique avant toute
communication commerciale. Le même avertissement que celui déjà publié sur la
page Produits s'applique intégralement ici.

---

## 1. Pourquoi l'immotique s'applique particulièrement bien à Modulimo

L'immotique en petit multilogement est habituellement un mauvais calcul :
l'ingénierie de contrôle est vendue au bâtiment tertiaire, elle coûte cher, et
cinq logements ne l'amortissent pas. Quatre particularités renversent ce
calcul dans le cas Modulimo.

**1.1 — La construction industrialisée déplace le coût au bon moment.**
Le poste dominant de toute immotique résidentielle n'est pas le matériel, c'est
la main-d'œuvre de câblage en rénovation. Un conduit vide, un neutre à chaque
boîte d'interrupteur, une descente Cat6 vers le local technique et un puits de
service posés *en usine* coûtent quelques centaines de dollars par logement ;
posés après coup, ils en coûtent dix fois plus, avec ouverture de murs. Le
modèle constructif de Modulimo est donc le meilleur moment de sa vie pour
décider du pré-équipement — et le PPCMOI en cours est la dernière fenêtre où ce
choix reste gratuit.

**1.2 — L'infrastructure logicielle existe déjà et tourne dans le bâtiment.**
L'appliance CoHabitat (`deploy/`) est une machine dans le local technique qui
fait déjà tourner PostgreSQL, une API, une passerelle de fédération et Caddy en
réseau fermé. Le module `serre-iot/` y ajoute déjà le schéma exact dont
l'immotique a besoin : capteurs → **MQTT (Mosquitto)** → passerelle → table
Postgres via un **compte appareil** autorisé par RLS → affichage dans
l'application. L'immotique de bâtiment n'est pas un nouveau système à acheter ;
c'est le même patron appliqué à d'autres capteurs et à quelques actionneurs.
Le README de `serre-iot` l'anticipe explicitement : « découpler les deux via
MQTT permet d'ajouter facilement d'autres abonnés (tableau de bord local,
alertes, domotique) sans toucher à l'acquisition ».

**1.3 — Le bâtiment a un opérateur qui habite dedans.**
La cause d'échec numéro un de l'immotique résidentielle est l'absence de
quelqu'un pour la tenir vivante après la deuxième année. Ici, le fondateur est
propriétaire-occupant : la gouvernance de proximité annoncée sur la page
Projets est aussi la condition technique de viabilité du système.

**1.5 — Le bâtiment est explicitement évolutif, et l'évolutif se pré-équipe.**
L'autorisation porte actuellement sur cinq logements ; la sixième unité est
aménagée en salle commune, avec l'intention de la convertir en logement si le
cadre le permet un jour. Un espace qui doit changer d'usage est précisément
celui qu'il faut instrumenter et pré-équiper dès la construction : socle de
compteur, place au panneau, attentes de plomberie et de ventilation, conduit de
mesure. Fait au chantier, c'est marginal ; fait après, cela repasse par le
raccordement électrique et par un permis. C'est le même raisonnement que
l'escalier « pensé pour bien vieillir » et le puits central prêt à recevoir une
plateforme élévatrice, déjà au concept — la conversion se prépare, elle ne
s'improvise pas. Voir §3, rang 7.

**1.4 — Le modèle promet déjà des choses qui *sont* de l'immotique.**
Trois engagements déjà publiés ne peuvent pas être tenus sans automatisation de
bâtiment :

| Engagement publié | Ce que ça exige techniquement |
|---|---|
| Niveaux Vert / Bleu / Orange avec « voyants clignotants pendant un exercice, fixes en situation réelle » (page Sécurité) | Un bus de signalisation par étage piloté par un état central — c'est un automate de bâtiment |
| Cartes d'accès pour l'entrée, les équipements partagés et les zones communes (page Sécurité) | Contrôle d'accès en réseau, avec droits liés aux réservations CoHabitat |
| Autopartage sur deux zones — 3 cases de flotte au sous-sol, 1 case visiteur et 1 case louée en cour avant | Réservation, accès temporaire, recharge pilotée et répartition de puissance entre deux tableaux |
| Système de levage pour les déménagements ; puits central prêt pour une plateforme élévatrice (page Accueil / Pointe Est) | Commande, verrouillages de sécurité, journal d'usage |

**Conclusion de section.** L'immotique n'est pas une option à ajouter au projet
Modulimo : elle est déjà implicite dans ce qui est promis. La vraie question
n'est pas « faut-il en faire », mais « jusqu'où, à quel coût, et quelles
briques rapportent assez pour être vendues à la clientèle ».

---

## 2. Le principe économique directeur

> **Le dollar attirant pour un ménage n'est pas le kilowattheure. C'est la
> deuxième voiture, la case de stationnement, la paire laveuse-sécheuse,
> l'abonnement au gym et la franchise d'assurance.**

Un logement québécois chauffé à l'électricité consomme, selon sa taille et son
enveloppe, de l'ordre de 6 000 à 14 000 kWh/an ; au tarif D 2026
(7,065 ¢/kWh sous 40 kWh/jour, 11,142 ¢ au-delà), la facture annuelle se situe
grosso modo entre 600 $ et 1 400 $. Même une immotique très bien réglée n'en
retranche que 10 à 20 %, soit **100 à 250 $/an**. C'est réel, mais ce n'est pas
ce qui fait signer un bail ou une promesse d'achat.

Ce qui fait signer, ce sont les dépenses que le partage supprime : une
deuxième voiture coûte de l'ordre de **6 000 à 9 000 $/an** tout compris ; une
case de stationnement souterrain, **25 000 à 50 000 $** de capital ou 100 à
200 $/mois ; une paire laveuse-sécheuse, 1 500 à 2 500 $ plus 3 à 4 m² de
plancher ; un abonnement de gym, 500 à 900 $/an.

**L'immotique est ce qui rend le partage crédible.** Personne n'accepte de
renoncer à sa case privée si réserver la minivan est pénible, si la borne est
occupée, si la salle commune est froide en arrivant ou si l'accès dépend d'une
clé qu'il faut aller chercher. Le rôle économique de l'immotique chez Modulimo
n'est donc pas de couper des kWh : **c'est de sécuriser les économies de
partage, qui sont dix fois plus grosses.** Les économies d'énergie viennent en
prime, et servent surtout de preuve mesurée.

---

## 3. Les leviers économiques, classés par dollars réels pour le ménage

Chaque levier est décrit par : le gain annuel pour le résident, la brique
d'immotique qui le rend possible, et la réserve à lever.

### Rang 1 — Renoncer à la deuxième voiture (6 000–9 000 $/an par ménage)

*C'est de loin le plus gros chèque du modèle.* Un ménage de Pointe-aux-Trembles
avec deux voitures peut en abandonner une si, et seulement si, l'accès à la
minivan partagée est aussi fluide que d'ouvrir sa propre portière.

**Brique immotique :** réservation dans CoHabitat (tables `vehicles`, `trips`,
`trip_bookings` déjà en place) → ouverture de porte de garage et de véhicule
liée à la réservation → recharge terminée garantie à l'heure du départ →
télémétrie du niveau de charge affichée avant de réserver.

**Le détail qui décide de tout :** la garantie de charge. Un autopartage
électrique sans pilotage de recharge produit une voiture à 30 % au moment du
départ, et l'expérience est morte au troisième incident. Le planificateur doit
réserver la puissance en fonction des réservations à venir, pas de l'ordre
d'arrivée.

**Réserve :** l'assurance de flotte partagée et le cadre contractuel de
l'autopartage entre résidents doivent être validés (courtier + juriste) avant
d'en faire un argument de vente chiffré.

### Rang 2 — Ne pas acheter de case privée (25 000–50 000 $ de capital)

La dernière version du projet compte **5 cases : 3 au sous-sol et 2 en cour
avant** — soit moins d'une par logement, ce qui suppose que le partage
fonctionne, et ce qui satisfait tout de même le minimum de 4 cases posé par
l'arrondissement. L'économie va aux deux côtés : le ménage n'achète pas de
case, et le promoteur n'excave que 3 cases au lieu de 6 — c'est le poste de
construction le plus cher au mètre carré du bâtiment.

**Brique immotique :** gestion de charge dynamique sur les bornes. C'est aussi
ce qui évite le second gros chèque, côté immeuble : **une mise à niveau de
l'entrée électrique** (typiquement 15 000 à 40 000 $ en multilogement). Cinq
bornes 240 V non pilotées appellent une entrée surdimensionnée ; les mêmes
cinq bornes en partage de puissance tiennent dans l'entrée existante, parce
qu'elles ne chargent jamais toutes à pleine puissance en même temps. Le
répartiteur doit couvrir **les deux zones à la fois** : une puissance
disponible unique, partagée entre le sous-sol et la cour avant, et non deux
budgets indépendants qui s'additionnent au pire moment.

**Ce que les deux cases extérieures changent.** Trois choses, et deux d'entre
elles sont des décisions de chantier, pas d'exploitation :

1. **Le conduit se pose maintenant ou jamais.** Alimenter deux bornes en cour
   avant après coup suppose une tranchée dans un aménagement fini — plusieurs
   milliers de dollars et un massif de plantation défait. Passer un conduit
   surdimensionné vers l'avant pendant l'excavation coûte quelques centaines de
   dollars, et cette dépense est explicitement admissible à Roulez vert au titre
   de l'infrastructure électrique surdimensionnée. C'est la même logique de
   couche 0 que le pré-équipement des logements (§6), appliquée au terrain.
2. **Une borne extérieure n'est pas une borne de sous-sol.** Boîtier étanche,
   socle ou bollard de protection, gestion du câble en hiver, et déneigement
   qui doit pouvoir se faire sans arracher l'équipement. Compter un surcoût
   par rapport à une borne intérieure, à faire chiffrer avec l'électricien.
3. **Leur affectation est arrêtée et elle n'est pas la même pour les deux :**
   une **case visiteur temporaire** et une **case louée à un résident**. La
   flotte partagée reste au sous-sol, à l'abri et sous contrôle d'accès.

**Les deux cases extérieures ne demandent pas le même outillage.**

*La case visiteur* est un objet de réservation courte durée : créneau réservé
dans CoHabitat par le résident qui reçoit, droit d'accès temporaire au terrain,
durée maximale et rappel automatique à l'échéance. C'est du logiciel, pas du
matériel — et c'est ce qui évite la seule chose qui empoisonne une place
visiteur : celui qui s'y installe à demeure. Au départ, elle n'a pas besoin de
borne : **le conduit suffit** (voir point 1), et on ajoute la borne le jour où
le besoin se manifeste.

*La case louée à un résident* est un contrat récurrent : elle produit un revenu
mensuel, elle est attribuée à une personne, et c'est là que se logent deux
questions d'exploitation à trancher avant la livraison.

- **Comment on l'attribue.** Une seule case attribuée dans un immeuble qui dit
  « aucune case privée » est visible par tout le monde. Une règle écrite
  d'avance — rotation annuelle avec liste d'attente tenue dans CoHabitat, plutôt
  que premier arrivé à perpétuité — coûte une décision aujourd'hui et évite une
  rancune durable. C'est aussi, accessoirement, la première fonction de
  gouvernance que le logiciel rend visible et vérifiable.
- **Comment on facture la recharge.** Si la borne de cette case est alimentée
  par le compteur des communs, **facturer les kWh au locataire de la case est
  précisément ce que la loi interdit** (§5.1). La forme admissible est un
  **forfait fixe inclus dans le loyer de la case**, calibré sur une
  consommation raisonnable et révisable — pas une facture au kilowattheure.
  À faire valider par un juriste, et à écrire dans le bail plutôt que dans un
  règlement d'immeuble.

**Conséquence de dimensionnement :** au départ, une seule borne extérieure est
nécessaire (celle de la case louée), plus le conduit pour la seconde. Le
répartiteur, lui, doit être prévu dès le début pour l'état final — sous-sol et
cour avant sur une même enveloppe de puissance.

*Point réglementaire à valider :* le stationnement en cour avant interagit avec
le recul avant de 6 m, avec le taux de verdissement et avec les conditions
posées par l'arrondissement dans le cadre du PPCMOI. À faire confirmer avec
l'architecte mandaté et l'arrondissement avant d'y prévoir des bornes.

**Programme applicable :** *Roulez vert — volet multilogement* rembourse
jusqu'à 50 % des dépenses admissibles, incluant explicitement les **appareils
et logiciels de gestion d'énergie** et l'**infrastructure électrique
surdimensionnée**. Les plafonds annoncés varient selon les sources (5 000 $ par
projet dans certaines, jusqu'à 25 000 $ pour un projet multilogement avec
gestion intelligente dans d'autres) : **à confirmer directement auprès du
programme.** Point de calendrier critique : **les dépenses effectuées après le
31 décembre 2026 ne seraient plus admissibles.** Si le PPCMOI et le chantier
franchissent cette date, l'aide est perdue — cela doit remonter dans les
arbitrages de séquence maintenant.

### Rang 3 — La buanderie commune (1 500–2 500 $ de capital + 3–4 m² par logement)

Cinq paires laveuse-sécheuse, c'est 7 500 à 12 500 $ d'appareils et environ 17 m²
cumulés de plancher, dans un immeuble où le m² privé est ce qui coûte le plus
cher à construire. Deux ou trois machines commerciales partagées font le même
travail.

**Brique immotique :** réservation + démarrage différé automatique hors pointe
+ notification de fin dans CoHabitat + facturation à l'usage via le solde
interne (tables `transactions` déjà en place). Sans notification de fin, la
buanderie commune devient un point de friction et un sujet de conflit — c'est
l'automatisation qui la rend acceptable.

### Rang 4 — Tarif Flex D et effacement de pointe (150–650 $/an)

Le tarif **Flex D** échange un prix hors pointe très bas (**~4,03 ¢/kWh**,
environ 40 % sous le tarif D) contre un prix fortement majoré — de l'ordre de
5× — pendant un nombre limité d'événements de pointe critique annoncés 24 h à
l'avance : de l'ordre de 22 à 33 événements de 4 h par hiver (plafonné autour
de 30 événements / 120 h), typiquement 6 h–10 h et 16 h–20 h, hors jours fériés.

Le gain est **entièrement conditionnel à la capacité d'effacer** pendant ces
120 heures. Un ménage sans automatisation perd souvent au change ; un ménage
dont le chauffe-eau, la recharge et une partie du chauffage sont pilotés gagne
franchement. Les économies typiques rapportées pour un ménage avec véhicule
électrique se situent entre **350 et 650 $/an**.

**Brique immotique :** trois charges à piloter, par ordre de rentabilité et de
facilité :

1. **Le chauffe-eau comme batterie thermique.** Préchauffage 2 h avant
   l'événement, coupure pendant les 4 h. Aucun inconfort perceptible, aucun
   changement d'habitude, gain immédiat. C'est le meilleur rapport
   gain/complexité de tout le document (un contacteur et une sonde,
   150–300 $/logement).
2. **La recharge des véhicules**, décalée par le planificateur.
3. **Un abaissement modéré du chauffage** dans les pièces peu occupées, jamais
   dans les chambres d'enfants ni chez une personne âgée.

**Réserve structurante :** l'adhésion au tarif appartient au **titulaire du
compte Hydro-Québec**, donc au résident si les logements sont comptés
individuellement, et à l'immeuble pour les communs. Modulimo ne peut donc pas
« vendre » cette économie : elle peut l'**offrir, l'outiller et la mesurer**.
La formulation commerciale correcte est « votre logement est équipé pour tirer
parti du tarif Flex D et le tableau de bord vous montre ce que ça donne », pas
« vous économiserez X $ ».

### Rang 5 — Programme Hilo et défis de pointe (~150–205 $/hiver)

Hilo fournit des **thermostats intelligents gratuits** en échange de la
participation à des défis d'effacement. Les participants ont reçu en moyenne
**205 $** à l'issue de l'hiver 2024-2025 ; combiné au tarif Flex D, l'économie
moyenne rapportée pour l'hiver 2025-2026 est d'environ **150 $**. Hydro-Québec
a effacé environ **700 MW** de pointe l'hiver dernier avec 470 000 participants,
et prévoit de remplacer les récompenses en argent par des réductions sur la
facture.

**Intérêt pour Modulimo :** c'est du matériel de chauffage piloté, gratuit, qui
arrive avec un programme de rémunération déjà rodé. **Limite :** l'écosystème
Hilo est infonuagique et propriétaire — il contredit la promesse d'appliance en
réseau fermé si on l'installe comme colonne vertébrale.

**Position recommandée :** Hilo dans le *logement*, à la discrétion du
résident, sur son propre compte, avec ses propres récompenses ; l'immotique
Modulimo dans les *communs et l'infrastructure*, en local et sans nuage. Les
deux coexistent sans se marcher dessus, à condition de ne jamais faire dépendre
une fonction de bâtiment d'un service tiers en ligne. **À valider :**
l'admissibilité exacte en multilogement locatif et le cumul avec Flex D.

### Rang 6 — Détection de fuite d'eau et coupure automatique (50–200 $/an + le sinistre évité)

Le dégât d'eau est **la première cause de réclamation** en assurance habitation :
il représente environ **50 % des sommes indemnisées au Québec** et environ 60 %
des réclamations au Canada selon le Bureau d'assurance du Canada. Certains
assureurs accordent **10 à 20 %** de rabais sur la prime pour un système
complet ; le rabais est souvent conditionnel à la **fermeture automatique de la
vanne d'entrée** (c'est le cas chez Beneva), et certains assureurs
(CAA-Québec, iA) n'en accordent aucun.

**Pourquoi c'est un levier majeur ici, au-delà du rabais :** dans un immeuble
à structure légère et à assemblages industrialisés, un dégât d'eau non détecté
au troisième étage traverse trois logements. Le coût évité n'est pas la prime,
c'est le sinistre, la franchise, la hausse de prime consécutive, et surtout la
réputation d'un modèle qu'on veut répliquer.

**Brique immotique :** une sonde par point de risque (chauffe-eau, lave-linge,
lave-vaisselle, sous-évier, drain de plancher) + une **vanne motorisée par
logement** + une vanne principale. Ordre de grandeur : 600 à 1 200 $ par
logement, environ 5 000 à 8 000 $ pour l'immeuble.

**Astuce commerciale légitime :** faire chiffrer le rabais par l'assureur
**avant** la construction et exiger l'engagement écrit. Un rabais négocié à
l'échelle de l'immeuble et transféré au résident est un argument vérifiable,
contrairement à une économie estimée.

### Rang 7 — La salle commune : un logement entier partagé par cinq ménages

Ce levier change de nature avec la dernière version du programme. Il ne s'agit
plus d'une pièce commune d'appoint, mais d'**une unité complète — de l'ordre de
90 à 110 m² — partagée par cinq ménages seulement**. Rapporté au ménage, c'est
le plus gros équipement du bâtiment après le stationnement, et probablement ce
qui compense le mieux, aux yeux d'un acheteur, la densité qu'on n'a pas obtenue :
un voisin de moins, un logement entier de gagné en partage.

Ce qui compte économiquement, c'est ce que cette surface **retire des logements
privés** : bureau de télétravail, chambre d'amis, salle de jeux, gym, cinéma,
atelier, buanderie. Chacune de ces fonctions, laissée dans le privé, se paie en
mètres carrés — c'est-à-dire au poste le plus cher du bâtiment. Un ménage qui
n'a pas besoin d'une chambre d'amis parce que l'immeuble en fournit une
économise plusieurs dizaines de milliers de dollars de construction.

**Brique immotique :** la réservation déclenche l'ouverture de porte, la montée
en température et l'éclairage 15 minutes avant, puis la remise en veille après.
L'enjeu financier a changé d'échelle avec la surface : **chauffer une unité
entière en continu pour quelques heures d'usage par semaine coûte de l'ordre de
600 à 1 400 $ par an**, alors qu'un pilotage à la réservation en récupère une
bonne part. C'est le seul poste où confort et économie pointent exactement dans
la même direction. CoHabitat gère déjà les espaces et leur tarification
(`common_spaces`, `space_pricing`, `space_reservations`) : la brique existe, il
lui manque les actionneurs.

**Ce que la conversion future exige — aujourd'hui, pas plus tard.** Convertir
une salle commune en logement suppose des choses qui coûtent presque rien au
chantier et très cher après :

| À prévoir maintenant | Pourquoi ça ne se rattrape pas |
|---|---|
| Socle de compteur supplémentaire et place au panneau | Ajouter un compteur ensuite, c'est reprendre l'entrée électrique — le poste le plus lourd et le plus lent à faire autoriser |
| Attentes de plomberie (alimentation, drain, évent) pour une cuisine et une salle de bain | Percer une dalle ou un plancher fini après coup, avec les assemblages industrialisés, est un chantier à part entière |
| Ventilation dimensionnée pour un logement, pas pour une salle | Les débits et le parcours des conduits ne se corrigent pas sans rouvrir |
| Conduit de mesure et de communication vers le local technique | Le futur logement doit pouvoir être mesuré et desservi comme les autres |
| Porte, insonorisation et contrôle d'accès traités comme ceux d'un logement | Change la perception d'usage immédiatement, et évite des reprises |

**Ce que ça implique côté logiciel :** les équipements de cette unité doivent
être rattachés à **un emplacement physique**, pas à son usage du moment. Le jour
où l'espace devient un logement, on change son type dans CoHabitat sans
rebrancher ni re-déclarer un seul appareil. C'est une décision de modèle de
données à prendre avant d'écrire le module (§7), pas après.

**À valider :** l'usage exact autorisé pour cette unité dans le cadre du
PPCMOI — en particulier si on y prévoit du couchage (chambre d'amis), qui
touche à la classification d'usage, aux issues et à la détection incendie, et
si l'espace peut servir à autre chose qu'aux résidents et à leurs invités.

### Rang 8 — Photovoltaïque piloté et mesurage net (variable — l'immotique conditionne le rendement)

Le toit-terrasse photovoltaïque est déjà au concept. En **option de mesurage
net**, 1 kWh injecté est crédité 1 kWh au tarif payé ; les crédits s'accumulent
du 1er avril au 31 mars et **les crédits inutilisés sont perdus** — Hydro-Québec
ne rachète pas le surplus. La puissance admissible a par ailleurs été relevée
de 50 kW à 1 MW, et de nouvelles aides à l'autoproduction solaire ont été
annoncées en 2026 (de l'ordre de 1 000 $/kW, plafond et prêt à taux nul **à
confirmer**).

**Conséquence directe :** le rendement d'une installation solaire dépend de la
part **autoconsommée**, donc du pilotage. Faire coïncider la production de
midi avec la recharge des véhicules, le chauffe-eau et la buanderie transforme
des crédits qui expireraient en kWh réellement utilisés. **C'est l'immotique
qui paie le solaire, pas l'inverse.**

**Réserve :** en multilogement, l'articulation entre le compteur des communs,
les compteurs de logements et le mesurage net est le point technique délicat.
À cadrer très tôt avec Hydro-Québec et l'électricien, avant le choix
d'architecture de comptage — après, c'est irréversible.

### Rang 9 — Accès sans clé, colis, entrées de service (100–300 $ ponctuels, beaucoup de friction en moins)

Cartes ou téléphones à la place des clés : plus de barillet à remplacer au
départ d'un résident, plus de déplacement pour laisser entrer un plombier, un
livreur ou une gardienne, droits temporaires révocables à distance.

**Brique immotique :** contrôleur d'accès IP local relié aux comptes CoHabitat,
avec émission de droits temporaires liés aux réservations et aux billets
d'entretien (le module `tickets` existe déjà).

### Rang 10 — Serre, forêt nourricière et élevages (200–600 $/an de panier)

Déjà largement construit côté logiciel (`sql/009` à `029` : serre, réservoirs,
récoltes, élevages, distribution, retraits gratuits) et côté matériel
(`serre-iot`). L'économie alimentaire réelle reste modeste ; la valeur est
d'usage et d'image — et le système est **déjà la démonstration vivante que
l'immotique Modulimo fonctionne**. À utiliser comme preuve, pas comme argument
d'économie.

---

## 4. Tableau de synthèse

| # | Levier | Gain annuel typique / ménage | Coût immotique associé | Programme mobilisable | Effort |
|---|---|---|---|---|---|
| 1 | 2ᵉ voiture remplacée par autopartage | 6 000–9 000 $ | inclus dans la borne + CoHabitat | Roulez vert | ●●○ |
| 2 | Case privée non achetée / entrée électrique non refaite | 25 000–50 000 $ de capital ; 15 000–40 000 $ évités côté immeuble | 5 000–12 000 $ (bornes intérieures et extérieures + gestion de charge + conduit vers la cour avant) | Roulez vert (≤ 50 %) | ●●○ |
| 3 | Buanderie commune | 1 500–2 500 $ de capital + 3–4 m² | 300–800 $ | — | ●○○ |
| 4 | Flex D + effacement piloté | 350–650 $ | 150–300 $/logement (chauffe-eau) | Tarif Flex D | ●○○ |
| 5 | Défis Hilo | 150–205 $ | 0 $ (thermostats fournis) | Hilo | ●○○ |
| 6 | Fuite d'eau + vanne motorisée | 50–200 $ de prime + sinistre évité | 600–1 200 $/logement | rabais assureur | ●●○ |
| 7 | Salle commune pilotée (une unité entière pour 5 ménages) | 500–900 $ (gym) + 600–1 400 $ de chauffage évité + m² privés non construits | 1 500–3 000 $ + attentes de conversion | — | ●○○ |
| 8 | Solaire autoconsommé | selon dimensionnement | pilotage : ~500 $ | mesurage net + aides 2026 | ●●● |
| 9 | Accès sans clé | 100–300 $ ponctuels | 3 000–8 000 $ (4–6 portes) | — | ●●○ |
| 10 | Serre / élevages | 200–600 $ | déjà réalisé | — | ✔ fait |

Effort : ●○○ simple · ●●○ coordination requise · ●●● dépend de tiers.
Les montants sont des ordres de grandeur à valider projet par projet.

---

## 5. Les trois lignes rouges

**5.1 — Ne pas refacturer l'électricité aux résidents.**
La *Loi sur la Régie de l'énergie* (RLRQ, c. R-6.01) interdit la revente
d'électricité sur le territoire du distributeur exclusif. Installer des
sous-compteurs est permis ; **facturer les kWh mesurés ne l'est pas.** Toute
« astuce » de répartition à la consommation doit donc passer par un montage
validé juridiquement, et non par une facturation au kWh déguisée.

*La formulation qui reste permise et qui est, de fait, plus attirante :*
mesurer pour **informer** (chaque ménage voit sa courbe, sa comparaison à la
moyenne de l'immeuble, l'effet d'un geste), et **récompenser un comportement**
en crédits CoHabitat — le solde interne existe déjà et sert déjà à la Machine
Lunch, aux espaces et aux véhicules. Un crédit de 20 $ sur le solde interne pour
un hiver bien effacé est plus engageant qu'une ligne de facture, coûte moins
cher, et ne touche pas à la revente d'énergie. **À faire valider par un
juriste avant mise en œuvre.**

**5.2 — Loi 25 : la donnée du logement appartient au résident.**
Un immeuble instrumenté produit des données de présence. La position déjà
prise dans `config.js` pour les caméras — désactivées par défaut, visibilité
`admin`, aucune image enregistrée — est la bonne, et doit être étendue à toute
l'immotique : mesure agrégée pour l'immeuble, données fines dans le logement
visibles **du seul résident**, durées de conservation courtes et écrites,
consentement explicite, aucune capacité pour l'exploitant de piloter un
équipement à l'intérieur d'un logement sans action du résident.

*Incohérence à corriger avant la prochaine mise à jour du site :* la page
Sécurité annonce « Surveillance 24/7 — caméras couvrant tous les accès et
espaces communs en continu », alors que CoHabitat annonce « aucune image n'est
enregistrée par CoHabitat ». Les deux affirmations peuvent être vraies
ensemble (diffusion en direct sans enregistrement), mais la formulation
actuelle laisse entendre un enregistrement continu. À aligner : c'est
exactement le genre d'écart qu'un acheteur attentif — ou une plainte — relève.

**5.3 — Aucune fonction de bâtiment ne doit dépendre d'un service en ligne.**
Le fil conducteur de tout le travail déjà accompli est l'autonomie : appliance
en réseau fermé, `central.enabled: false` possible, librairies servies en local,
« aucun octet ne sort du bâtiment ». Une serrure qui exige un nuage, un
thermostat dont le fabricant peut couper l'API, une passerelle à abonnement :
chacun de ces choix annule l'argument. **Critère d'achat non négociable :
Matter, Zigbee, Modbus ou contact sec, pilotable hors ligne, sans abonnement
obligatoire.** Corollaire : pas de marque unique — le jour où un fournisseur
change de modèle d'affaires, on remplace un composant, pas le système.

---

## 6. Architecture proposée — trois couches

**Couche 0 — Pré-équipement passif (à décider maintenant, avec l'architecte).**
Conduit surdimensionné vers les deux cases de la cour avant, posé pendant
l'excavation ; conduits vides des logements vers le local technique ; neutre à chaque boîte
d'interrupteur ; Cat6 vers chaque logement, la salle commune, le garage et le
toit ; espace libre au panneau ; point d'eau instrumentable ; passage réservé
dans le puits central. Coût en usine : quelques centaines de dollars par
logement. Coût après coup : dix fois plus. **C'est la seule décision de ce
document qui devient irréversible avec le PPCMOI.**

**Couche 1 — Socle (à la livraison).** Sur l'appliance CoHabitat existante :
un conteneur de supervision, le broker MQTT déjà présent, un coordinateur
Zigbee/Thread, un onduleur, un VLAN dédié aux équipements. Ordre de grandeur :
1 000 à 1 500 $ de matériel, puisque la machine, la base de données et le
reverse proxy sont déjà là.

**Couche 2 — Modules.** Chauffe-eau piloté, gestion de charge des bornes, eau
et vannes, éclairage et chauffage des communs, accès, signalisation des niveaux
Vert/Bleu/Orange, télémétrie solaire. Chacun est indépendant, chacun se
justifie séparément, chacun se retire sans casser les autres.

**Couche 3 — Confort du logement (optionnelle, au résident).** Thermostats
Hilo, éclairage, stores. Modulimo fournit le pré-équipement et l'expertise ;
le résident décide, et reste propriétaire de ses données.

---

## 7. Ce que ça implique dans CoHabitat

Le travail logiciel est modeste, parce que le patron existe déjà (`serre-iot`
et `sql/009_serre.sql` en fournissent le gabarit exact) :

- **4 à 6 tables** : `iot_appareils`, `iot_mesures`, `iot_commandes`,
  `energie_evenements` (événements de pointe Flex D), `energie_lectures`,
  `alertes_batiment` — avec la même RLS que `serre_lectures` (compte appareil
  autorisé en insertion, lecture selon le rôle).
- **Un service de plus dans `docker-compose.yml`** pour la supervision, derrière
  le même Caddy ; aucune ouverture de port supplémentaire.
- **Un bloc de configuration dans `config.js`**, sur le modèle exact du bloc
  `cameras` (désactivé par défaut, `visibility`, `baseUrl` vide = même origine).
  L'immotique doit être un module que l'on peut ne pas activer : les immeubles
  vendus ensuite n'auront pas tous le même équipement.
- **Un écran** dans l'application : état du bâtiment, prochain événement de
  pointe, consommation des communs, alertes eau — et, dans l'espace de chaque
  résident, sa propre courbe et lui seul.
- **Un rattachement des appareils à un emplacement physique**, jamais à l'usage
  de cet emplacement. La salle commune destinée à devenir un logement l'impose :
  le jour de la conversion, on change le type de l'espace, pas le câblage ni la
  déclaration des appareils.
- **Une extension de `transactions`** pour les crédits d'effacement (voir §5.1),
  une fois le cadre juridique validé.

Cette brique renforce mécaniquement la thèse déjà énoncée sur la page
Produits — « le logiciel crée l'avantage opérationnel » : un immeuble mesuré
est un immeuble dont on peut prouver la performance à un assureur, à un
prêteur, à un programme de subvention et au prochain acheteur du modèle.
C'est ce qui distingue un immeuble d'un produit réplicable.

---

## 8. Séquence recommandée

| Phase | Quand | Contenu | Décision requise |
|---|---|---|---|
| **P0** | Avant le gel des plans (PPCMOI / architecte) | Pré-équipement passif, conduit vers les cases extérieures, socle de compteur et attentes pour la conversion de la salle commune, architecture de comptage électrique, cadrage mesurage net | Architecte + électricien CMEQ + Hydro-Québec |
| **P1** | Chantier | Bornes (sous-sol et cour avant) + gestion de charge sur les deux zones, chauffe-eau pilotés, sondes d'eau + vannes, éclairage/chauffage des communs | Dossier Roulez vert **déposé avant le 31 décembre 2026** ; engagement écrit de l'assureur |
| **P2** | Livraison | Socle sur l'appliance, écran CoHabitat, accès, signalisation Vert/Bleu/Orange | Interne |
| **P3** | Hiver 1 | Adhésion Flex D (communs), défis Hilo (résidents volontaires), mesure et publication des résultats réels | Sur données mesurées |
| **P4** | Année 2 | Optimisation de l'autoconsommation solaire, crédits d'effacement (si le cadre juridique le permet), gabarit réplicable pour l'immeuble suivant | Sur résultats de P3 |

Budget indicatif P1 + P2, hors solaire et hors subventions : **15 000 à
25 000 $** pour cinq logements et la salle commune, soit environ 3 000 à
4 500 $ par unité, dont une part significative est admissible à Roulez vert
pour le volet recharge.

---

## 9. Ce qu'on peut dire à la clientèle — et comment le dire

Trois promesses tenables, formulées de façon vérifiable :

1. **« Ici, une voiture suffit. »** Pas « vous économiserez 8 000 $ » : on
   montre la disponibilité réelle des véhicules, mesurée et affichée dans
   l'application. La preuve remplace la promesse.
2. **« Le bâtiment surveille l'eau, pas vous. »** Détection et coupure
   automatiques, avec le rabais d'assurance négocié à l'avance et chiffré par
   l'assureur lui-même.
3. **« Votre consommation, vous la voyez ; personne d'autre ne la voit. »**
   Mesure fine visible du seul résident, agrégat pour l'immeuble, aucun octet
   qui sort du bâtiment.

Ce qu'il faut éviter dans le matériel commercial : tout chiffre d'économie
garanti, toute mention d'une facture réduite d'un pourcentage donné, toute
formulation qui ressemble à de la refacturation d'énergie. L'avis déjà publié
sur la page Produits couvre le principe ; il doit être appliqué à la lettre
sur ce sujet, où la tentation du chiffre rond est la plus forte.

---

## 10. Réorienter la page Sécurité vers l'immotique

**Recommandation : oui, et c'est probablement la meilleure page du site pour
porter le sujet.** Trois raisons.

**10.1 — La page promet déjà de l'immotique, mais la vend comme de la
surveillance.** « Surveillance 24/7 », « accès magnétique », « voyants
clignotants ou fixes selon le niveau », « terrain clôturé » : ce sont des
fonctions de gestion technique de bâtiment, présentées dans un registre
sécuritaire. Le registre est le problème. La surveillance se vend mal (elle
inquiète, elle pose une question de vie privée, et elle place le résident du
mauvais côté du dispositif), alors que la même infrastructure racontée comme
un bâtiment qui *veille sur l'eau, l'air, le feu et le froid* se vend très
bien — et correspond mieux à la thèse déjà écrite en tête de page : « la
préparation aux risques est portée par le bâtiment, pas par les résidents ».

**10.2 — L'immotique donne à la page ce qui lui manque : du vérifiable.**
Aujourd'hui, la page repose surtout sur des engagements de processus
(protocoles, exercices annuels, formation, conférences). Excellents, mais
invérifiables par un visiteur. L'immotique apporte des faits mesurables :
la vanne d'eau se ferme en quelques secondes, la température des communs ne
descend jamais sous X °C en panne, l'état du bâtiment est affiché en direct.
Une page de sécurité qui montre des mécanismes est plus convaincante qu'une
page qui promet de la rigueur.

**10.3 — Le bloc le plus persuasif est celui que personne n'écrit : ce que le
bâtiment *ne fait pas*.** Aucune caméra dans les logements ni dans les
corridors privatifs ; aucune donnée qui sort du bâtiment ; aucun pilotage à
distance de l'intérieur d'un logement par l'exploitant ; conservation limitée
et écrite. Dans un marché saturé d'objets connectés qui remontent tout vers un
nuage, c'est un argument différenciant — et il est déjà vrai dans
l'architecture CoHabitat, donc gratuit à affirmer.

### Structure proposée pour `src/securite/index.html`

Conserver le titre (« Un immeuble pensé pour la quiétude ») et les niveaux
Vert / Bleu / Orange, qui deviennent l'interface visible du système. Remplacer
la grille « Sécurité intrinsèque » par trois blocs :

| Bloc | Contenu |
|---|---|
| **Ce que le bâtiment observe en continu** | eau (fuite, gel), fumée et CO, température, panne de courant, portes et accès, état des équipements partagés |
| **Ce qu'il fait tout seul** | ferme la vanne d'eau, bascule les communs en mode panne, allume la signalisation d'étage, prévient les bonnes personnes, journalise |
| **Ce qu'il ne fait pas** | aucune caméra dans les logements, aucune donnée hors du bâtiment, aucun pilotage à distance de votre logement, conservation limitée |

Puis conserver, en seconde moitié, la trame PPMS existante (trousse 72 h, plan
familial, exercices) : elle reste juste, et elle prend plus de force une fois
adossée à des dispositifs concrets.

### Deux corrections à faire au passage

1. **« Surveillance 24/7 — caméras couvrant tous les accès et espaces communs
   en continu »** doit être aligné avec la position technique retenue (voir
   §5.2). Si la caméra reste en affichage sans enregistrement, l'écrire ;
   sinon, dire ce qui est enregistré et pendant combien de temps.
2. **« Sélection des résidents — processus de sélection rigoureux pour
   maintenir un milieu de vie serein »** est à reformuler. En location
   résidentielle au Québec, les motifs de sélection sont encadrés par la
   *Charte des droits et libertés de la personne* (interdiction de
   discrimination en matière de logement), et une formulation aussi ouverte
   invite une lecture défavorable. S'en tenir à des critères objectifs et
   usuels (capacité de payer, références), ou retirer le bloc.

*Rappel de procédure :* la page est trilingue et générée. On édite
`src/securite/index.html` (avec les grappes `data-lang="fr|en|es"`), puis
`node build.js`, puis on commite le tout — jamais les pages générées.

---

## 11. CoHabitat comme BMS résidentiel — réseau fermé, option VPN

**Recommandation : oui, et c'est un repositionnement de produit, pas seulement
une fonctionnalité de plus.** En anglais on parle de *Building Management
System* (BMS) ou *Building Automation System* (BAS) ; en français
d'**immotique** ou de **GTB** (gestion technique du bâtiment) ; en espagnol
d'*inmótica*. Le vocabulaire compte, parce qu'il change l'interlocuteur : un
« logiciel de gestion résidentielle » se vend à un propriétaire, un « BMS » se
vend aussi à un assureur, à un prêteur et à un gestionnaire de parc.

### 11.1 — Le créneau existe et il est vide

| Catégorie | Exemples | Cible | Pourquoi ça ne couvre pas Modulimo |
|---|---|---|---|
| BMS tertiaire | Tridium/Niagara, Siemens Desigo, JCI Metasys | > 50 000 pi², immeubles de bureaux | Coût d'entrée et intégrateur obligatoire hors de proportion pour 5 logements |
| Domotique grand public | Google Home, Alexa, Hilo | le logement, un occupant | Infonuagique, mono-logement, aucune notion de bail, de solde ni d'espace commun |
| Logiciels de gestion immobilière | Hopem, Proprio Expert, Yardi | comptabilité et baux | Aucun lien avec le bâtiment physique — ils ne savent pas qu'une vanne s'est fermée |

Le trou : **le multilogement de 6 à 50 unités, opéré par son propriétaire, avec
une exigence de souveraineté des données.** C'est exactement la cible de
CoHabitat, et c'est un créneau que les trois catégories ci-dessus ignorent
chacune pour une raison différente.

### 11.2 — CoHabitat a déjà quatre des cinq piliers d'un BMS

| Pilier BMS | État dans CoHabitat |
|---|---|
| Acquisition terrain | ✔ `serre-iot/` : capteurs → MQTT → passerelle |
| Historisation | ✔ PostgreSQL sur l'appliance, tables de lectures horodatées |
| Droits et rôles | ✔ RLS, comptes appareils (`serre_is_capteur()`), rôles admin/locataire |
| Interface multi-usagers | ✔ application unique résidents + administration |
| Supervision multi-sites | ✔ fédération Ed25519 par VPN, jumelage à droits asymétriques |
| **Pilotage (actionneurs, règles, planification)** | **✘ à construire** |
| **Alarmes et escalade** | **✘ à construire** |

Autrement dit, le chemin restant est court : deux couches, pas un produit.

### 11.3 — La décision d'architecture qui décide de tout : ne pas écrire de pilotes

La tentation naturelle est d'ajouter des pilotes Zigbee, Modbus, BACnet et
Z-Wave dans CoHabitat. C'est un puits sans fond : chaque marque, chaque
firmware, chaque révision de protocole devient une dette permanente.

**Montage recommandé — deux couches, une frontière nette :**

```
   Équipements  ──►  couche appareils (Home Assistant ou équivalent libre)
                          │  MQTT  (déjà présent sur l'appliance)
                          ▼
                     CoHabitat  ──►  résidents, réservations, soldes,
                                     billets, règles d'usage, historique
```

La couche appareils apporte des milliers d'intégrations maintenues par
d'autres ; CoHabitat garde ce que personne d'autre ne fait : **les gens et
l'argent** — qui a réservé, qui paie quoi, qui a le droit d'ouvrir quelle
porte, quel billet est ouvert sur quel équipement. Le pont est MQTT, qui existe
déjà et dont le README de `serre-iot` anticipe justement l'extension.

Conséquence de configuration : un bloc `bms` dans `config.js`, sur le modèle
exact du bloc `cameras` — **désactivé par défaut**, avec `visibility` et une
`baseUrl` vide signifiant « même origine ». Tous les immeubles n'auront pas le
même équipement ; le module doit pouvoir ne pas exister.

### 11.4 — La frontière de sécurité, à écrire noir sur blanc

Un BMS résidentiel ne doit **jamais** porter de fonction de sécurité des
personnes. L'alarme incendie (CAN/ULC-S524 et le Code de construction),
l'ascenseur ou la plateforme élévatrice du puits central (CSA B44 / B355) et le
déverrouillage des issues restent sur des systèmes certifiés, autonomes et
inspectés. **Le BMS observe et notifie ; il ne commande pas.**

Le précédent maison est déjà écrit et il est bon : la caméra est en
**affichage seulement**, le pilotage PTZ reste dans l'outil dédié, parce qu'un
ordre mal arrêté dans une application ouverte par tous les locataires est un
risque qui n'a pas sa place. La même règle s'applique, en plus strict, à tout
ce qui touche la vie humaine. À écrire dans la documentation du module : un
client ne doit jamais pouvoir supposer le contraire.

### 11.5 — Le réseau fermé avec option VPN est l'argument central, pas un détail

C'est là que le positionnement BMS devient réellement distinctif. Tous les
concurrents grand public exigent un nuage ; les BMS tertiaires exigent un
intégrateur. CoHabitat en appliance offre le contraire des deux :

- **fonctionnement nominal sans Internet** — réservations, effacement,
  alarmes eau, accès et historiques tournent sur la machine du local technique,
  aucun octet ne sort ;
- **le VPN comme seule porte**, pour trois usages seulement : le résident en
  déplacement, le jumelage entre immeubles, et la supervision du parc par
  l'exploitant ;
- **la supervision de parc en lecture** — étendre `cohabitat doctor` à la santé
  des équipements donne à l'exploitant une vue « état du parc » (batteries de
  capteurs, vannes qui ne répondent plus, événements de pointe manqués) sans
  jamais lui donner la main sur un logement. C'est précisément le modèle de
  droits asymétriques déjà implémenté dans le jumelage (`peer allow`), appliqué
  à un autre objet.

Cette dernière brique est ce qui rend un **réseau d'immeubles** opérable — donc
ce qui rend crédible la logique de franchise déjà énoncée sur la page Produits,
et ce que `modulimo-admin` modélise déjà côté contrats, licences et forfaits.

### 11.6 — Ce que ça change au modèle d'affaires

Un logiciel de gestion résidentielle a un défaut commercial connu : une fois
l'immeuble livré, le client ne voit plus pourquoi il paierait chaque année. Un
BMS n'a pas ce défaut, parce qu'il produit en continu trois choses qui ont un
prix :

1. **De la disponibilité** — l'immeuble fonctionne, et on sait tout de suite
   quand ce n'est plus le cas ;
2. **Du risque évité** — l'eau coupée avant le sinistre, ce que l'assureur sait
   valoriser ;
3. **De la preuve** — des relevés qui servent aux demandes de subvention, au
   financement, à la revente, et à la mise au point de l'immeuble suivant.

C'est ce qui justifie une licence récurrente par immeuble, et c'est la
traduction opérationnelle exacte de la thèse 02 de la page Produits : « le
logiciel crée l'avantage opérationnel ».

### 11.7 — Effort et risque

L'effort logiciel est modeste (voir §7 : quatre à six tables, un conteneur, un
écran, un bloc de configuration). **Le coût réel n'est pas le code : c'est la
mise en service** — choisir les équipements, les poser, les étalonner, les
documenter, et les remplacer dans cinq ans. C'est ce que Pointe Est doit servir
à mesurer, sur un seul immeuble, avant d'en faire une promesse de catalogue.

Le risque principal est la dérive de portée : « BMS » est un mot qui appelle des
attentes de certification. La parade est de nommer le produit pour ce qu'il
fait — **supervision et confort, jamais sécurité des personnes** (§11.4) — et
de garder chaque module désactivable, comme la caméra l'est déjà.

---

## 12. Réserves et vérifications à mener

| À vérifier | Auprès de | Bloquant pour |
|---|---|---|
| Plafond et échéance réels du volet multilogement de Roulez vert | Programme Roulez vert | P1 — calendrier |
| Admissibilité Hilo en multilogement locatif, cumul avec Flex D | Hilo / Hydro-Québec | P3 |
| Architecture de comptage et mesurage net en multilogement | Hydro-Québec + CMEQ | **P0 — irréversible** |
| Rabais de prime pour détection + coupure automatique | Assureur de l'immeuble | P1 |
| Légalité du montage de crédits d'effacement en solde interne | Juriste | P4 |
| Assurance et cadre contractuel de l'autopartage entre résidents | Courtier + juriste | Rang 1 |
| Cohérence entre « surveillance 24/7 » (page Sécurité) et « aucune image enregistrée » (CoHabitat) | Interne | Communication, §10 |
| Formulation du bloc « sélection des résidents » au regard de la Charte | Juriste | Page Sécurité, §10 |
| Stationnement en cour avant : recul de 6 m, taux de verdissement, conditions du PPCMOI | Architecte + arrondissement | Bornes extérieures, §3 rang 2 |
| Forme juridique du forfait de recharge inclus dans le loyer de la case louée | Juriste | §3 rang 2 |
| Règle d'attribution de la case louée (rotation, liste d'attente) | Interne | À écrire avant la livraison |
| Usage autorisé de la salle commune, couchage éventuel, ouverture hors résidents | Architecte + arrondissement | §3 rang 7, classification d'usage |
| Étage d'implantation de la salle commune et incidence sur la conversion | Architecte | Pré-équipement P0 |
| Pages du site annonçant « 4 cases au sous-sol » et « 6 logements » à mettre à jour | Interne | Communication |
| Périmètre du module BMS : aucune fonction de sécurité des personnes | Interne + ingénieur | §11.4, documentation du module |

---

## Sources

Programmes et tarifs (consultés en août 2026 ; les sites d'Hydro-Québec
n'étaient pas joignables depuis l'environnement de rédaction — les valeurs
ci-dessous proviennent de sources secondaires et **doivent être confirmées à
la source**) :

- Tarif Flex D et prix du kWh 2026 — <https://brancheqc.ca/guide/tarif-flex-d-hydro-quebec-borne-recharge>, <https://brancheqc.ca/guide/prix-kwh-hydro-quebec-2026-cout-recharge-vehicule-electrique>
- Grille tarifaire officielle — <https://www.hydroquebec.com/data/documents-donnees/pdf/grille-tarifaire.pdf>
- Programme Hilo, résultats hiver 2025-2026 — <https://www.lapresse.ca/affaires/2026-04-14/programme-hilo/les-thermostats-gratuits-font-fondre-la-pointe-hivernale.php>, <https://www.hiloenergie.com/fr-ca/>, <https://www.protegez-vous.ca/nouvelles/habitation/le-programme-hilo-ce-que-vous-devez-savoir>
- Roulez vert — volet multilogement — <https://bornesderecharge.quebec/subventions/roulez-vert>, <https://hellodarwin.com/fr/aide-aux-entreprises/programmes/roulez-vert-remboursement-pour-une-borne-multilogement>
- LogisVert / ÉcoPerformance — <https://brancheqc.ca/guide/programme-logisvert-thermopompe-2026>
- Mesurage net et aides à l'autoproduction solaire 2026 — <https://brancheqc.ca/subvention-solaire-hydro-quebec>, <https://www.pv-magazine.fr/2026/04/08/hydro-quebec-annonce-de-nouvelles-subventions-pour-accelerer-lautoproduction-solaire/>
- Dégâts d'eau et rabais d'assurance — <https://www.lapersonnelle.com/assurances/habitation/prevention-degats-d-eau.html>, <https://www.caaquebec.com/fr/conseils/assurer-une-propriete/detecteurs-de-fuites-d-eau-pour-eviter-les-degats>
- Sous-mesurage et revente d'électricité — <https://defienergie.ca/mesurage-et-sous-mesurage-energetique-avec-des-locataires/> ; *Loi sur la Régie de l'énergie*, RLRQ c. R-6.01

Sources internes : `modulimo-home/src/` (pages Accueil, Produits, Sécurité,
Mobilité, Pointe Est), `CoHabitat/README.md`, `CoHabitat/deploy/README.md`,
`CoHabitat/config.js`, `CoHabitat/schema.sql`, `CoHabitat/sql/`,
`CoHabitat/serre-iot/README.md`.
