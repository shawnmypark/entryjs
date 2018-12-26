export class EntryBaseTexture extends PIXI.BaseTexture {


    updateSource(src:HTMLImageElement|HTMLCanvasElement) {
        this.loadSource(src);
    }
}