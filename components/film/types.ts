export type SceneId = "scene-a" | "scene-b" | "scene-c";

export type ManifestEntry = {
  frames: number;
  width: number;
  height: number;
  placeholder: boolean;
};

export type Manifest = Record<SceneId, ManifestEntry>;
