import { defineTechnique } from './define.js';

export const phishingSpear = defineTechnique({
  id: 'phishing.spear',
  name: 'Spear-phishing',
  family: 'initial-access',
  summary:
    'A targeted social-engineering lure delivers a payload or steals credentials from a specific human.',
  references: [{ url: 'https://attack.mitre.org/techniques/T1566/', title: 'MITRE ATT&CK T1566' }],
  defaultProbability: 0.4,
  defaultDifficulty: 0.4,
  defaultDetection: 0.3,
  requires: [],
  tags: ['human', 'classical'],
  taxonomy: { mitreAttack: ['T1566'] },
});

export const credentialDump = defineTechnique({
  id: 'credential.dump',
  name: 'Credential dumping',
  family: 'credential-access',
  summary: 'Extract account material from process memory, OS stores, or credential vaults.',
  references: [{ url: 'https://attack.mitre.org/techniques/T1003/', title: 'MITRE ATT&CK T1003' }],
  defaultProbability: 0.5,
  defaultDifficulty: 0.5,
  defaultDetection: 0.5,
  tags: ['classical'],
  taxonomy: { mitreAttack: ['T1003'] },
});

export const credentialReuse = defineTechnique({
  id: 'credential.reuse',
  name: 'Valid-account reuse',
  family: 'lateral-movement',
  summary:
    'An attacker who already holds a valid credential pivots into another system that trusts it.',
  references: [{ url: 'https://attack.mitre.org/techniques/T1078/', title: 'MITRE ATT&CK T1078' }],
  defaultProbability: 0.7,
  defaultDifficulty: 0.2,
  defaultDetection: 0.4,
  requires: ['credential.dump'],
  tags: ['classical'],
  taxonomy: { mitreAttack: ['T1078'] },
});

export const lateralSsh = defineTechnique({
  id: 'lateral.ssh',
  name: 'SSH lateral movement',
  family: 'lateral-movement',
  summary: 'Pivot between hosts over SSH using stolen or shared keys.',
  references: [
    { url: 'https://attack.mitre.org/techniques/T1021/004/', title: 'MITRE ATT&CK T1021.004' },
  ],
  defaultProbability: 0.6,
  defaultDifficulty: 0.3,
  defaultDetection: 0.3,
  tags: ['classical', 'network'],
  taxonomy: { mitreAttack: ['T1021.004'] },
});

export const lateralAssumeRole = defineTechnique({
  id: 'lateral.assume-role',
  name: 'Assume cloud role',
  family: 'privilege-escalation',
  summary:
    'Use a held identity to assume a more privileged role, often via permissive trust policies.',
  references: [
    { url: 'https://attack.mitre.org/techniques/T1078/004/', title: 'MITRE ATT&CK T1078.004' },
  ],
  defaultProbability: 0.5,
  defaultDifficulty: 0.4,
  defaultDetection: 0.5,
  tags: ['classical', 'cloud'],
  taxonomy: { mitreAttack: ['T1078.004'] },
});

export const exfilData = defineTechnique({
  id: 'exfil.data',
  name: 'Data exfiltration',
  family: 'exfiltration',
  summary: 'Move data out of the environment over an attacker-controlled channel.',
  references: [{ url: 'https://attack.mitre.org/techniques/T1041/', title: 'MITRE ATT&CK T1041' }],
  defaultProbability: 0.6,
  defaultDifficulty: 0.3,
  defaultDetection: 0.4,
  tags: ['classical'],
  taxonomy: { mitreAttack: ['T1041'] },
});

export const classicalTechniques = [
  phishingSpear,
  credentialDump,
  credentialReuse,
  lateralSsh,
  lateralAssumeRole,
  exfilData,
];
