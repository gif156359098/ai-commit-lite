import {
  buildClientBootstrapScript,
  buildClientEventScript,
  buildClientFormScript,
  buildClientPreludeScript,
  buildClientRenderScript
} from './profileManagerPanelClientSections';

export function buildClientScript(): string {
  return [
    buildClientPreludeScript(),
    buildClientRenderScript(),
    buildClientFormScript(),
    buildClientEventScript(),
    buildClientBootstrapScript()
  ].join('\n');
}
