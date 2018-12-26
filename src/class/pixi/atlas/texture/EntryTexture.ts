import { ImageRect } from '../../../maxrect-packer/geom/ImageRect';
import Rectangle = PIXI.Rectangle;
import { EntryBaseTexture } from './EntryBaseTexture';

export class EntryTexture extends PIXI.Texture {

    public imageRect:ImageRect;
    private _isEmptyTexture:boolean;
    public textureScaleFactor:number;

    constructor(baseTexture: EntryBaseTexture, imageRect:ImageRect) {
        var frame = new Rectangle(0, 0, imageRect.width, imageRect.height);
        // baseTexture.hasLoaded = true; // false 이면 이벤트 super.constructor 에서 eventListening 을 하기 때문에 그것을 회피 하기 위해 true로 임시 설정
        super(baseTexture, frame);
        // baseTexture.hasLoaded = false;// false 로 해놔야 렌더러에서 drawing을 안함.  이후 updateBaseAndUVs 를 동해 baseTexture 참조가 변경되면 렌더링이 가능해짐.
        this._isEmptyTexture = true;
        this.imageRect = imageRect;
        this.textureScaleFactor = imageRect.scaleFactor;
    }

    get isEmptyTexture():boolean {
        return this._isEmptyTexture;
    }

    getBaseTexture():EntryBaseTexture {
        return this.baseTexture as EntryBaseTexture;
    }

    assignTextureScaleFactor(target:PIXI.RenderTexture) {
        //textureScaleFactor 변수 네이밍을 여기저기서 쓰지 않으려고 메서드를 만듬.
        (target as any).textureScaleFactor = this.textureScaleFactor;
    }
}