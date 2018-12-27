/*
생성자에서 empty base texture 를 받은 후, sprite 를 통해 즉시 stage에서 사용 할 수 있도록 함.
 */

import Rectangle = PIXI.Rectangle;
import { AtlasBaseTexture } from './AtlasBaseTexture';
import { ImageRect } from '../../../maxrect-packer/geom/ImageRect';
import { AtlasImageLoadingInfo } from '../loader/AtlasImageLoadingInfo';

export class AtlasTexture extends PIXI.Texture {

    public imageRect:ImageRect;
    private _isEmptyTexture:boolean;
    public textureScaleFactor:number;

    constructor(baseTexture: AtlasBaseTexture, imageRect:ImageRect) {
        var frame = new Rectangle(0, 0, imageRect.width, imageRect.height);
        super(baseTexture, frame);
        this._isEmptyTexture = true;
        this.imageRect = imageRect;
        this.textureScaleFactor = imageRect.scaleFactor;
    }

    get isEmptyTexture():boolean {
        return this._isEmptyTexture;
    }

    getBaseTexture():AtlasBaseTexture {
        return this.baseTexture as AtlasBaseTexture;
    }

    assignTextureScaleFactor(target:PIXI.RenderTexture) {
        //textureScaleFactor 변수 네이밍을 여기저기서 쓰지 않으려고 메서드를 만듬.
        (target as any).textureScaleFactor = this.textureScaleFactor;
    }

    /**
     * @param info
     * @param extrude - must uint value. Reduce flickering in some cases where sprites have to be put next to each other in the final program.
     * example: https://www.codeandweb.com/texturepacker/documentation/texture-settings
     */
    drawImageAtBaseTexture(info:AtlasImageLoadingInfo, extrude:number):void {
        if(this._isEmptyTexture) return;
        var img = info.source();
        var ctx:CanvasRenderingContext2D = this.getBaseTexture().getCtx();
        var r = this.frame;
        var w = r.width;
        var h = r.height;
        var rx = r.x;
        var ry = r.y;

        var sw = info.srcWidth;
        var sh = info.srcHeight;

        /* //for debug background
        ctx.fillStyle = PIXIHelper.randomRGBAString(0.3);
        ctx.fillRect(rx, ry, w, h);
        //*/
        ctx.drawImage(img, 0, 0, sw, sh, rx, ry, w, h);
        if(extrude) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            //top
            ctx.drawImage(img, 0, 0, sw, 1, rx, ry - extrude, w, extrude);
            //down
            ctx.drawImage(img, 0, sh - 1, sw, 1, rx, ry + h, w, extrude);
            //left
            ctx.drawImage(img, 0, 0, 1, sh, rx - extrude, ry, extrude, h);
            //right
            ctx.drawImage(img, sw - 1, 0, 1, sh, rx + w, ry, extrude, h);
            ctx.restore();
        }
    }

    /**
     * 진짜로 사용할 BaseTexture를 할당 받고, uv를 업데이트 함.
     * @param base
     */
    updateBaseAndUVs(base:AtlasBaseTexture):void {
        this._isEmptyTexture = false;
        this.baseTexture = base;
        if(this.frame.x != this.imageRect.x || this.frame.y != this.imageRect.y) {
            this.frame.x = this.imageRect.x;
            this.frame.y = this.imageRect.y;
            this._updateUvs();
        }
    }
}