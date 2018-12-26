import PIXIHelper from '../helper/PIXIHelper';
import Rectangle = PIXI.Rectangle;
import { MaxRectsPacker } from '../../maxrect-packer/maxrects_packer';

interface ITexOption {
    /** 텍스쳐 1개의 최대 크기. 이 크기보다 크면 리사이즈 함. */
    texMaxRect:Rectangle;
}

interface IAtlasOption extends ITexOption {
    extrudeSize:number;
    atlasSize:number;
    newPacker:()=>MaxRectsPacker;
}


export class EntryTextureOption {


    private readonly GPU_TEX_MAX_SIZE:number;

    /** 텍스쳐를 최대 몇으로 할지의 값을 Canvas.width , height 기준으로 몇배로 할 지에 대한 값. */
    private readonly _texStageRatio:number;

    readonly scaleMode = PIXI.SCALE_MODES.LINEAR;
    readonly mipmap:boolean = false;
    readonly atlasOption:IAtlasOption;


    constructor(stageWidth:number, stageHeight:number) {

        this.GPU_TEX_MAX_SIZE = this.computeMaxTextureSize(4096);
        this._texStageRatio = 1;

        this.atlasOption = {
            texMaxRect: this.getTexRect(stageWidth, stageHeight, this._texStageRatio, this.GPU_TEX_MAX_SIZE),
            extrudeSize: 2,
            atlasSize: this.GPU_TEX_MAX_SIZE,
            newPacker: this.newPacker.bind(this)
        };
    }


    private newPacker():MaxRectsPacker{
        //https://www.npmjs.com/package/maxrects-packer
        const PADDING = 6; //텍스쳐 사이의 간격.
        const BORDER = 2; //베이스 텍스쳐 테두리 간격
        const MAX = this.atlasOption.atlasSize;
        const OPTION = {
            smart: false,
            pot: true,
            square: false,
        };
        return new MaxRectsPacker(MAX, MAX, BORDER, PADDING, OPTION);
    }


    private getTexRect(w:number, h:number, ratio:number, max:number):Rectangle {
        return new Rectangle(0,0,
            Math.min(Math.round(w * ratio), max),
            Math.min(Math.round(h * ratio), max),
        )
    }


    private computeMaxTextureSize(LIMIT:number):number {
        var canvas:HTMLCanvasElement = PIXIHelper.getOffScreenCanvas(true);
        var ctx:WebGLRenderingContext = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        var size = ctx ? ctx.getParameter(ctx.MAX_TEXTURE_SIZE) : 2048;
        size = Math.min(size, LIMIT);
        console.log("Max texture size : " + size);
        return size;
    }
}