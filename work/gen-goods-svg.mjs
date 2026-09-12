// 生成商品占位图（矢量，无外网依赖）：work/gen-goods-svg.mjs
// 用法：node work/gen-goods-svg.mjs
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('outputs/clothing-wholesale/public/goods')
fs.mkdirSync(OUT, { recursive: true })

const S = (inner, bg1, bg2) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect width="400" height="400" fill="url(#glow)"/>
  <ellipse cx="200" cy="336" rx="98" ry="15" fill="#000" opacity="0.05"/>
${inner}
</svg>
`

const G = (d, main, dark) => `<g fill="${main}" stroke="${dark}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${d}</g>`

const shapes = {
  tee: (m, d) =>
    G(
      `<path d="M150 122 L106 148 L86 200 L122 216 L140 178 L140 312 L260 312 L260 178 L278 216 L314 200 L294 148 L250 122 C245 152 155 152 150 122 Z"/>
       <path d="M150 122 C168 138 232 138 250 122" fill="none"/>`,
      m,
      d,
    ),
  shirt: (m, d) =>
    G(
      `<path d="M150 122 L108 146 L88 200 L122 214 L140 176 L140 314 L260 314 L260 176 L278 214 L312 200 L292 146 L250 122 L200 152 L150 122 Z"/>
       <path d="M150 122 L200 152 L250 122 L236 112 L200 132 L164 112 Z" fill="${d}" stroke="none"/>
       <path d="M200 152 L200 314" fill="none" stroke-width="2" opacity="0.7"/>
       <circle cx="200" cy="196" r="4" fill="${d}" stroke="none"/>
       <circle cx="200" cy="240" r="4" fill="${d}" stroke="none"/>
       <circle cx="200" cy="284" r="4" fill="${d}" stroke="none"/>
       <path d="M132 176 L132 314" fill="none" stroke-width="2" opacity="0.35"/>`,
      m,
      d,
    ),
  dress: (m, d) =>
    G(
      `<path d="M156 118 L124 142 L108 190 L136 202 L150 168 L144 212 C124 256 112 300 108 324 L292 324 C288 300 276 256 256 212 L250 168 L264 202 L292 190 L276 142 L244 118 C238 148 162 148 156 118 Z"/>
       <path d="M150 168 C176 182 224 182 250 168" fill="none" stroke-width="2.5"/>
       <path d="M200 116 L200 168" fill="none" stroke-width="2" opacity="0.4"/>`,
      m,
      d,
    ),
  skirt: (m, d) =>
    G(
      `<path d="M138 140 L262 140 L304 322 L96 322 Z"/>
       <path d="M138 140 L262 140 L262 162 L138 162 Z" fill="${d}" stroke="none"/>
       <path d="M170 170 L150 322 M200 170 L200 322 M230 170 L250 322" fill="none" stroke-width="2" opacity="0.3"/>`,
      m,
      d,
    ),
  pants: (m, d) =>
    G(
      `<path d="M138 128 L262 128 L276 316 L228 316 L200 206 L172 316 L124 316 Z"/>
       <path d="M138 128 L262 128 L262 152 L138 152 Z" fill="${d}" stroke="none"/>
       <path d="M172 160 L168 250 M228 160 L232 250" fill="none" stroke-width="2" opacity="0.28"/>`,
      m,
      d,
    ),
  jeans: (m, d) =>
    G(
      `<path d="M138 128 L262 128 L276 318 L228 318 L200 208 L172 318 L124 318 Z"/>
       <path d="M138 128 L262 128 L262 150 L138 150 Z" fill="${d}" stroke="none"/>
       <path d="M150 154 C160 176 168 184 186 188 M250 154 C240 176 232 184 214 188" fill="none" stroke-width="2" stroke-dasharray="5 4" opacity="0.8"/>
       <path d="M186 188 L188 318 M214 188 L212 318" fill="none" stroke-width="2" stroke-dasharray="5 4" opacity="0.8"/>
       <circle cx="200" cy="140" r="5" fill="${d}" stroke="none"/>`,
      m,
      d,
    ),
  knit: (m, d) =>
    G(
      `<path d="M152 122 L104 150 L78 286 L118 298 L136 210 L136 314 L264 314 L264 210 L282 298 L322 286 L296 150 L248 122 C242 150 158 150 152 122 Z"/>
       <path d="M136 268 L264 268 M136 288 L264 288" fill="none" stroke-width="2" opacity="0.35"/>
       <path d="M168 124 C182 138 218 138 232 124" fill="none"/>`,
      m,
      d,
    ),
  coat: (m, d) =>
    G(
      `<path d="M152 120 L106 148 L92 322 L152 334 L154 196 L200 242 L246 196 L248 334 L308 322 L294 148 L248 120 L200 166 Z"/>
       <path d="M152 120 L200 166 L248 120 L232 108 L200 136 L168 108 Z" fill="${d}" stroke="none"/>
       <circle cx="176" cy="250" r="5" fill="${d}" stroke="none"/>
       <circle cx="176" cy="292" r="5" fill="${d}" stroke="none"/>
       <path d="M128 190 L128 320 M272 190 L272 320" fill="none" stroke-width="2" opacity="0.3"/>`,
      m,
      d,
    ),
  hoodie: (m, d) =>
    G(
      `<path d="M150 126 L104 154 L84 262 L120 274 L138 210 L138 316 L262 316 L262 210 L280 274 L316 262 L296 154 L250 126 C244 154 156 154 150 126 Z"/>
       <path d="M150 126 C160 172 240 172 250 126 C232 100 168 100 150 126 Z" fill="${d}" stroke="none" opacity="0.95"/>
       <path d="M182 168 L182 206 M218 168 L218 206" fill="none" stroke-width="3"/>
       <path d="M148 250 L252 250 L252 300 L148 300 Z" fill="none" stroke-width="2.5" opacity="0.55"/>`,
      m,
      d,
    ),
  jacket: (m, d) =>
    G(
      `<path d="M150 122 L106 148 L88 236 L122 250 L140 200 L140 316 L260 316 L260 200 L278 250 L312 236 L294 148 L250 122 L200 154 Z"/>
       <path d="M150 122 L200 154 L250 122 L238 110 L200 132 L162 110 Z" fill="${d}" stroke="none"/>
       <path d="M200 154 L200 316" fill="none" stroke-width="3"/>
       <path d="M162 200 L162 316 M238 200 L238 316" fill="none" stroke-width="2" opacity="0.3"/>
       <path d="M150 258 L250 258" fill="none" stroke-width="3" opacity="0.5"/>`,
      m,
      d,
    ),
  kidtee: (m, d) =>
    G(
      `<path d="M166 148 L132 168 L116 208 L146 220 L160 190 L160 296 L240 296 L240 190 L254 220 L284 208 L268 168 L234 148 C230 170 170 170 166 148 Z"/>
       <path d="M200 216 l7 16 17 2 -12 12 3 17 -15 -9 -15 9 3 -17 -12 -12 17 -2 z" fill="${d}" stroke="none"/>`,
      m,
      d,
    ),
  set: (m, d) =>
    G(
      `<path d="M118 116 L86 134 L74 178 L98 188 L110 160 L110 236 L188 236 L188 160 L200 188 L224 178 L212 134 L180 116 C176 134 122 134 118 116 Z"/>
       <path d="M212 150 L318 150 L336 300 L194 300 Z"/>
       <path d="M212 150 L318 150 L318 170 L212 170 Z" fill="${d}" stroke="none"/>`,
      m,
      d,
    ),
  bag: (m, d) =>
    G(
      `<path d="M104 168 L296 168 L312 322 L88 322 Z"/>
       <path d="M150 168 C150 116 250 116 250 168" fill="none" stroke-width="8"/>
       <path d="M104 210 L296 210" fill="none" stroke-width="3" opacity="0.5"/>
       <rect x="184" y="196" width="32" height="26" rx="6" fill="${d}" stroke="none"/>`,
      m,
      d,
    ),
  jewelry: (m, d) =>
    G(
      `<path d="M120 130 C120 250 280 250 280 130" fill="none" stroke-width="6"/>
       <circle cx="200" cy="252" r="22"/>
       <circle cx="200" cy="252" r="9" fill="${d}" stroke="none"/>
       <path d="M300 160 L300 196" fill="none" stroke-width="6"/>
       <circle cx="300" cy="214" r="18"/>
       <path d="M100 160 L100 196" fill="none" stroke-width="6"/>
       <circle cx="100" cy="214" r="18"/>`,
      m,
      d,
    ),
  hat: (m, d) =>
    G(
      `<path d="M108 252 C108 148 292 148 292 252 Z"/>
       <path d="M108 252 L292 252 L292 276 L108 276 Z" fill="${d}" stroke="none" rx="6"/>
       <path d="M148 190 L148 250 M200 176 L200 250 M252 190 L252 250" fill="none" stroke-width="2" opacity="0.3"/>
       <circle cx="200" cy="140" r="16" fill="${d}" stroke="none"/>`,
      m,
      d,
    ),
  shoes: (m, d) =>
    G(
      `<path d="M70 260 C70 238 92 228 122 222 L190 204 C210 199 226 204 238 216 C258 238 302 248 322 258 C332 263 336 271 336 281 L336 292 L70 292 Z"/>
       <path d="M58 290 L344 290 C348 290 350 294 350 298 L350 306 C350 312 346 316 340 316 L66 316 C60 316 56 312 56 306 L56 298 C56 294 58 290 58 290 Z" fill="${d}" stroke="none"/>
       <path d="M122 222 C148 244 186 252 228 246" fill="none" stroke-width="3" opacity="0.55"/>
       <circle cx="196" cy="246" r="6" fill="${d}" stroke="none"/>`,
      m,
      d,
    ),
  inner: (m, d) =>
    G(
      `<path d="M120 176 C120 148 160 138 200 176 C240 138 280 148 280 176 L268 232 C252 262 148 262 132 232 Z"/>
       <path d="M132 152 C120 132 118 118 128 108 M268 152 C280 132 282 118 272 108" fill="none" stroke-width="5"/>
       <path d="M156 220 C176 240 224 240 244 220" fill="none" stroke-width="3" opacity="0.5"/>`,
      m,
      d,
    ),
  loungewear: (m, d) =>
    G(
      `<path d="M140 112 L104 134 L92 200 L120 210 L134 176 L134 262 L226 262 L226 176 L240 210 L268 200 L256 134 L220 112 C216 132 144 132 140 112 Z"/>
       <path d="M252 176 L316 176 L328 316 L240 316 Z"/>
       <path d="M134 236 L226 236" fill="none" stroke-width="2" opacity="0.4"/>
       <circle cx="180" cy="150" r="4" fill="${d}" stroke="none"/>
       <circle cx="180" cy="192" r="4" fill="${d}" stroke="none"/>`,
      m,
      d,
    ),
}

const ITEMS = [
  { type: 'tee', m: '#dfd3c3', d: '#b8a88f', bg: ['#f7f3ec', '#eae0d2'] },
  { type: 'dress', m: '#8d3b45', d: '#6d2a33', bg: ['#fbf1f1', '#f0dcde'] },
  { type: 'shirt', m: '#e8e4dc', d: '#bfb7ab', bg: ['#f6f6f4', '#e6e6e2'] },
  { type: 'skirt', m: '#7b8a63', d: '#5e6b4a', bg: ['#f2f5ee', '#dfe7d6'] },
  { type: 'pants', m: '#33415c', d: '#25304a', bg: ['#eef2f8', '#dbe3ef'] },
  { type: 'jeans', m: '#6f8bab', d: '#52708f', bg: ['#eef3f8', '#d9e4ef'] },
  { type: 'knit', m: '#d8c3a5', d: '#b39c7c', bg: ['#fdf7ec', '#f2e5cf'] },
  { type: 'coat', m: '#b79b83', d: '#93795f', bg: ['#f8f3ee', '#ebdfd3'] },
  { type: 'hoodie', m: '#9aa6b1', d: '#78848f', bg: ['#f1f4f7', '#dfe5ea'] },
  { type: 'jacket', m: '#4c4f53', d: '#33363a', bg: ['#f2f2f3', '#e0e1e3'] },
  { type: 'kidtee', m: '#f0c9a6', d: '#cc9f77', bg: ['#fdf6ef', '#f6e4d3'] },
  { type: 'set', m: '#d9a7ac', d: '#b88287', bg: ['#fbf2f3', '#f0dee0'] },
  { type: 'bag', m: '#a97c62', d: '#845c46', bg: ['#f8f2ed', '#eaded4'] },
  { type: 'jewelry', m: '#d9b96a', d: '#b3923f', bg: ['#fbf8ef', '#f0e8d1'] },
  { type: 'hat', m: '#c05a5a', d: '#9b4242', bg: ['#fbf1ef', '#f2ded9'] },
  { type: 'shoes', m: '#3b3b3d', d: '#232325', bg: ['#f4f4f5', '#e3e3e5'] },
  { type: 'inner', m: '#e6d8cc', d: '#c3b2a3', bg: ['#fbf6f2', '#efe3da'] },
  { type: 'loungewear', m: '#a8b7a0', d: '#85a07c', bg: ['#f4f7f2', '#e2eae0'] },
]

ITEMS.forEach((item, i) => {
  const draw = shapes[item.type]
  if (!draw) throw new Error('missing shape: ' + item.type)
  const svg = S(draw(item.m, item.d), item.bg[0], item.bg[1])
  fs.writeFileSync(path.join(OUT, `g${i + 1}.svg`), svg, 'utf8')
})

console.log(`generated ${ITEMS.length} svg -> ${OUT}`)
