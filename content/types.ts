export type Kind = 'offering' | 'keeping' | 'relic';
export type ArtifactType = 'sign' | 'psalm' | 'instrument' | 'object';
export type Status = 'open' | 'upcoming' | 'kept' | 'closed';
export type Edition = 333 | 33 | 12 | 3 | 1;

export const KINDS: Kind[] = ['offering', 'keeping', 'relic'];
export const ARTIFACT_TYPES: ArtifactType[] = ['sign', 'psalm', 'instrument', 'object'];
export const STATUSES: Status[] = ['open', 'upcoming', 'kept', 'closed'];
export const EDITIONS: Edition[] = [333, 33, 12, 3, 1];

/** Instruments built into the site, made in code and run in the visitor's browser. */
export const TOOLS = ['godrays'] as const;
export type ToolId = (typeof TOOLS)[number];
export const TOOL_LABELS: Record<ToolId, string> = {
  godrays: 'godrays · a wallpaper made of light, different for everyone',
};

export interface Artifact {
  id: string;
  service: number;
  kind: Kind;
  type: ArtifactType;
  title: string;
  image: string;
  alt: string;
  status: Status;
  edition?: Edition;
  kept?: number;
  price?: string;
  href?: string;
  download?: string;
  guest?: string;
  /** words on the object's own page; blank lines split paragraphs */
  description?: string;
  /** a web page shown inside the object's page (a tool, a film, a piece of software) */
  embed?: string;
  /** an instrument built into the site */
  tool?: ToolId;
  /** images, films and sounds shown on the object's page, in order */
  media?: string[];
  /** kept in the admin only; the site does not show it until it is published */
  draft?: boolean;
}

/** What the admin stores: status is derived from the schedule unless pinned. */
export interface ArtifactRecord extends Omit<Artifact, 'status'> {
  status: 'auto' | Status;
}

export interface Settings {
  /**
   * ISO instant when service 001 opens; every next service opens seven days later.
   * The week before it is service 000, when the doors open with statement 000.
   */
  firstServiceAt: string;
  timezone: string;
  /** How many services this volume holds. Volume i is 33; then the doors close. */
  totalServices: number;
  instagram: string;
  archive: string;
}

export interface SiteData {
  settings: Settings;
  artifacts: ArtifactRecord[];
}

export interface Thesis {
  number: number;
  title: string;
  body: string;
  /** Scripture reference: Orthodox (Septuagint) numbering, western numbering in brackets where it differs. */
  reference?: string;
  /** The cited verse, shown on hover and focus. */
  verse?: string;
}
