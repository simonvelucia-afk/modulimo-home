# -*- coding: utf-8 -*-
import io, re, sys, html

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*([^*\n]+)\*(?!\*)', r'<em>\1</em>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'&lt;(https?://[^&\s]+)&gt;', r'<a href="\1">\1</a>', t)
    t = t.replace('✔', '<span class="ok">&#10004;</span>').replace('✘', '<span class="no">&#10008;</span>')
    return t

def convert(md):
    lines = md.split('\n')
    out, i, n = [], 0, len(lines)
    while i < n:
        ln = lines[i]
        s = ln.strip()

        if s.startswith('```'):
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith('```'):
                buf.append(html.escape(lines[i]))
                i += 1
            i += 1
            out.append('<pre class="block">%s</pre>' % '\n'.join(buf))
            continue

        if s == '---':
            out.append('<hr>'); i += 1; continue

        m = re.match(r'^(#{1,4})\s+(.*)$', s)
        if m:
            lvl = len(m.group(1))
            txt = inline(m.group(2))
            anchor = ''
            mm = re.match(r'^(\d+)\.\s+(.*)$', m.group(2))
            if lvl == 2 and mm:
                txt = '<span class="secnum">%s</span>%s' % (mm.group(1).zfill(2), inline(mm.group(2)))
            out.append('<h%d%s>%s</h%d>' % (lvl, anchor, txt, lvl))
            i += 1; continue

        if s.startswith('|') and i + 1 < n and re.match(r'^\|[\s:|-]+\|$', lines[i+1].strip()):
            head = [c.strip() for c in s.strip('|').split('|')]
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            t = ['<div class="tw"><table><thead><tr>']
            t += ['<th>%s</th>' % inline(c) for c in head]
            t.append('</tr></thead><tbody>')
            for r in rows:
                t.append('<tr>' + ''.join('<td>%s</td>' % inline(c) for c in r) + '</tr>')
            t.append('</tbody></table></div>')
            out.append(''.join(t)); continue

        if s.startswith('> '):
            buf = []
            while i < n and lines[i].strip().startswith('>'):
                buf.append(lines[i].strip().lstrip('>').strip()); i += 1
            out.append('<blockquote><p>%s</p></blockquote>' % inline(' '.join(buf)))
            continue

        if re.match(r'^[-*]\s+', s) or re.match(r'^\d+\.\s+', s):
            ordered = bool(re.match(r'^\d+\.\s+', s))
            items = []
            while i < n:
                cur = lines[i].strip()
                m2 = re.match(r'^(?:[-*]|\d+\.)\s+(.*)$', cur)
                if not m2:
                    if cur and items and lines[i].startswith(('  ', '\t')):
                        items[-1] += ' ' + cur; i += 1; continue
                    break
                items.append(m2.group(1)); i += 1
            tag = 'ol' if ordered else 'ul'
            out.append('<%s>%s</%s>' % (tag, ''.join('<li>%s</li>' % inline(x) for x in items), tag))
            continue

        if not s:
            i += 1; continue

        buf = []
        while i < n and lines[i].strip() and not lines[i].strip().startswith(('#', '|', '>', '```', '---')) \
              and not re.match(r'^(?:[-*]|\d+\.)\s+', lines[i].strip()):
            buf.append(lines[i].strip()); i += 1
        para = inline(' '.join(buf))
        cls = ''
        if para.startswith('<strong>Statut du document') or para.startswith('<strong>Objet') \
           or para.startswith('<strong>Périmètre') or para.startswith('Deux questions ajoutées'):
            cls = ' class="frontmatter"'
        out.append('<p%s>%s</p>' % (cls, para))
    return '\n'.join(out)

if __name__ == '__main__':
    src = io.open(sys.argv[1], encoding='utf-8').read()
    io.open(sys.argv[2], 'w', encoding='utf-8').write(convert(src))
    print('converted')
