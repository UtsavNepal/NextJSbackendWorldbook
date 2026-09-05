const BLOCKED_WORDS = [
  'anal', 'anus', 'asshole', 'bastard', 'bitch', 'blowjob', 'boob', 'boobs',
  'cock', 'cocks', 'crap', 'cum', 'cunt', 'damn', 'dick', 'dicks', 'dildo',
  'fag', 'faggot', 'fuck', 'fucked', 'fucker', 'fuckin', 'fucking', 'fuckyou',
  'hentai', 'hoe', 'hoes', 'horny', 'jerkoff', 'kill yourself', 'kys',
  'motherfucker', 'nazi', 'nigger', 'nigga', 'nude', 'nudes', 'orgasm',
  'pedo', 'pedophile', 'penis', 'piss', 'porn', 'porno', 'pussy', 'rape',
  'rapist', 'retard', 'retarded', 'sex', 'sexy', 'shit', 'shitty', 'slut',
  'slutty', 'sperm', 'stripper', 'suck my', 'tits', 'vagina', 'whore', 'wtf',
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const blockedPattern = new RegExp(
  `\\b(?:${BLOCKED_WORDS.map(escapeRegExp).join('|')})\\b`,
  'gi'
);

export function censorText(text?: string | null): string {
  if (!text) return text ?? '';
  return text.replace(blockedPattern, '****');
}
