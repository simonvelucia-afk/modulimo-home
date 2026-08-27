# -*- coding: utf-8 -*-
"""Assemble une etude Markdown en HTML pret a imprimer (couverture + styles).

Usage : python3 docs/pdf/make-html.py <etude.md> <logo.png> <sortie.html>
"""
import base64, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md2html import convert

CSS = """
@page { size: Letter; margin: 21mm 19mm 17mm 19mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body{ margin:0; background:#fff; color:#181C1A;
  font-family:"Bitstream Charter","Charter","Liberation Serif",Georgia,serif;
  font-size:10.4pt; line-height:1.52; }
h1,h2,h3,h4,th,.secnum,.cover-meta,.cover-kicker{
  font-family:"Liberation Sans","DejaVu Sans",Arial,sans-serif; }
.cover{ page-break-after:always; padding-top:6mm; }
.cover img.logo{ width:74mm; height:auto; display:block; margin-bottom:26mm; }
.cover-kicker{ font-size:8pt; letter-spacing:.18em; text-transform:uppercase; color:#2D5A4A;
  margin:0 0 9mm; padding-bottom:3mm; border-bottom:1.6pt solid #2D5A4A; }
.cover h1{ font-size:27pt; line-height:1.08; letter-spacing:-.02em; font-weight:700;
  margin:0 0 7mm; max-width:15cm; color:#15201B; }
.cover .sub{ font-size:12pt; line-height:1.5; color:#3E4744; max-width:13.5cm; margin:0 0 16mm; }
.cover-meta{ font-size:8.6pt; color:#5A635E; line-height:1.9; letter-spacing:.02em; }
.cover-meta b{ color:#181C1A; font-weight:700; display:inline-block; min-width:34mm; }
.cover-notice{ margin-top:20mm; border-top:.6pt solid #C9D0CB; padding-top:5mm;
  font-size:8.4pt; line-height:1.55; color:#5A635E; max-width:14cm; }
.cover-notice b{ color:#181C1A; }
h1{ font-size:19pt; }
.body h1{ display:none; }
h2{ font-size:14.5pt; font-weight:700; letter-spacing:-.015em; line-height:1.2;
  margin:11mm 0 3.5mm; padding-top:3mm; border-top:1.4pt solid #181C1A;
  page-break-after:avoid; break-after:avoid; color:#15201B; }
h2 .secnum{ display:block; font-size:8pt; letter-spacing:.16em; color:#2D5A4A;
  margin-bottom:2.2mm; font-weight:700; }
h3{ font-size:11pt; font-weight:700; margin:7mm 0 2mm; color:#15201B;
  page-break-after:avoid; break-after:avoid; }
h4{ font-size:10pt; font-weight:700; margin:5mm 0 1.5mm; }
p{ margin:0 0 3.2mm; orphans:2; widows:2; }
p.frontmatter{ color:#3E4744; }
a{ color:#2D5A4A; text-decoration:none; word-break:break-word; }
code{ font-family:"DejaVu Sans Mono","Liberation Mono",monospace; font-size:8.6pt;
  background:#F0F2EF; padding:.4mm 1mm; border-radius:1pt; color:#2A3330; }
hr{ border:none; border-top:.6pt solid #DDE2DE; margin:7mm 0; }
ul,ol{ margin:0 0 3.5mm; padding-left:6mm; }
li{ margin-bottom:1.4mm; }
blockquote{ margin:5mm 0; padding:4mm 6mm; background:#F2F5F1; border-left:2.4pt solid #2D5A4A;
  page-break-inside:avoid; }
blockquote p{ margin:0; font-size:11.5pt; line-height:1.42; font-weight:700; color:#1E3D32; }
pre.block{ font-family:"DejaVu Sans Mono","Liberation Mono",monospace; font-size:8pt; line-height:1.42;
  background:#F5F7F4; border:.6pt solid #DDE2DE; padding:4mm; margin:4mm 0;
  white-space:pre; overflow:hidden; page-break-inside:avoid; color:#2A3330; }
.tw{ margin:4mm 0 5mm; page-break-inside:avoid; }
table{ width:100%; border-collapse:collapse; font-size:8.9pt; }
th{ text-align:left; font-size:7.4pt; letter-spacing:.11em; text-transform:uppercase;
  color:#41504A; background:#EDF1EC; padding:2.2mm 2.6mm; border-bottom:.9pt solid #C9D0CB;
  vertical-align:bottom; }
td{ padding:2.2mm 2.6mm; border-bottom:.5pt solid #E2E7E2; vertical-align:top;
  line-height:1.42; color:#3E4744; }
td:first-child{ color:#181C1A; font-weight:700; }
.ok{ color:#2D5A4A; font-weight:700; }
.no{ color:#96382A; font-weight:700; }
h2 + p, h3 + p{ page-break-before:avoid; }
"""

COVER = u"""
<div class="cover">
  <img class="logo" src="data:image/png;base64,%(logo)s" alt="MODULIMO">
  <p class="cover-kicker">Analyse interne &#183; Projet Pointe Est</p>
  <h1>Immotique et b&#226;timent Modulimo</h1>
  <p class="sub">Applicabilit&#233; de l'immotique au mod&#232;le Modulimo, et hi&#233;rarchie des leviers
     &#233;conomiques r&#233;ellement attirants pour la client&#232;le &#8212; ceux qui font baisser une
     d&#233;pense que le m&#233;nage paie d&#233;j&#224;.</p>
  <div class="cover-meta">
    <div><b>R&#233;f&#233;rence</b> Pointe Est &#8212; 6 logements, 3 &#233;tages, Pointe-aux-Trembles, Montr&#233;al</div>
    <div><b>Statut</b> Document pr&#233;paratoire &#8212; concept en cheminement PPCMOI</div>
    <div><b>Date</b> Ao&#251;t 2026</div>
    <div><b>Source</b> modulimo-home / docs/immotique-pointe-est.md</div>
  </div>
  <div class="cover-notice">
    <b>Avis.</b> Les concepts, sc&#233;narios, montants et programmes pr&#233;sent&#233;s dans ce document sont
    fournis &#224; titre informatif et illustratif seulement. Ils ne constituent ni une offre de vente, ni une
    offre d'investissement, ni des plans d'ing&#233;nierie, ni une attestation de conformit&#233;, ni une
    garantie de performance, de s&#233;curit&#233;, de disponibilit&#233;, d'&#233;conomies ou de
    r&#233;sultats. Les montants cit&#233;s sont des ordres de grandeur destin&#233;s &#224;
    hi&#233;rarchiser des d&#233;cisions et doivent &#234;tre confirm&#233;s &#224; la source. Toute mise en
    &#339;uvre r&#233;elle devra &#234;tre valid&#233;e par les professionnels comp&#233;tents et conforme aux
    exigences techniques, r&#233;glementaires, contractuelles et financi&#232;res applicables.
  </div>
</div>
"""

def main(md_path, logo_path, out_path):
    logo = base64.b64encode(open(logo_path, 'rb').read()).decode()
    body = convert(io.open(md_path, encoding='utf-8').read())
    doc = (u'<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">'
           u'<title>Immotique et batiment Modulimo</title>\n<style>%s</style></head>\n'
           u'<body>%s<div class="body">%s</div></body></html>'
           % (CSS, COVER % {'logo': logo}, body))
    io.open(out_path, 'w', encoding='utf-8').write(doc)
    print('html ecrit :', out_path)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
