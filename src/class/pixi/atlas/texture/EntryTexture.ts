import { ImageRect } from '../../../maxrect-packer/geom/ImageRect';
import Rectangle = PIXI.Rectangle;
import { EntryBaseTexture } from './EntryBaseTexture';

export class EntryTexture extends PIXI.Texture {

    public textureScaleFactor:number;

    constructor(baseTexture: EntryBaseTexture, imageRect:ImageRect) {
        var frame = new Rectangle(0, 0, imageRect.width, imageRect.height);
        super(baseTexture, frame);
        this.textureScaleFactor = imageRect.scaleFactor;
    }


    getBaseTexture():EntryBaseTexture {
        return this.baseTexture as EntryBaseTexture;
    }

    assignTextureScaleFactor(target:PIXI.RenderTexture) {
        //textureScaleFactor 변수 네이밍을 여기저기서 쓰지 않으려고 메서드를 만듬.
        (target as any).textureScaleFactor = this.textureScaleFactor;
    }


}