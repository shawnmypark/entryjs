import { IRawPicture } from '../model/IRawPicture';
import { PIXIAtlasHelper } from '../PIXIAtlasHelper';
import { ImageRect } from '../../../maxrect-packer/geom/ImageRect';
import PIXIHelper from '../../helper/PIXIHelper';
import { clog } from '../../utils/logs';

declare let Entry:any;
declare let _:any;

enum LoadingState {
    NONE = 1,
    LOADING = 2,
    COMPLETE = 3,
    DESTROYED = 4
}






export class AtlasImageLoadingInfo {

    loadState:LoadingState = LoadingState.NONE;
    private _img:HTMLImageElement;
    private _canvas:HTMLCanvasElement;

    /**  계산된 이미지 경로. */
    private _realPath:string;

    /**  picture json 에 정의된 경로. fileurl or filename */
    private _rawPath:string;

    private _triedCnt:number = 0;
    private _picName:string;

    // 로드된 이미지 혹은 resize된 이미지의 사이즈. dimension 의 값과 다른 경우가 있어서 추가함.
    public srcWidth:number;
    public srcHeight:number;

    /**
     * model 의 이미지를 로드 후, imgRect.scaleFactor가 1이 아닐경우 imgRect 만큼 리사이즈한 canvas 를 소스로 설정하긔
     * @param model
     * @param _imgRect
     * @param _onLoadCallback
     */
    constructor(model:IRawPicture, private _imgRect:ImageRect, private _onLoadCallback:(info:AtlasImageLoadingInfo) => void) {
        this._realPath = this._getImageSrc(model);
        this._rawPath = PIXIAtlasHelper.getRawPath(model);
        this._picName = model.name;
    }

    source():HTMLImageElement|HTMLCanvasElement {
        return this._img || this._canvas;
    }

    load() {
        if(this.loadState != LoadingState.NONE) return;
        this.loadState = LoadingState.LOADING;
        var img:HTMLImageElement = new Image();
        this._img = img;

        img.onload = ()=>{
            Entry.Loader.removeQueue();
            if( this.loadState == LoadingState.DESTROYED ) return;
            this.loadState = LoadingState.COMPLETE;

            this._canvas = this._resizeIfOversized();
            if(this._canvas) {
                this._destroyImage();
            }

            this._onLoadCallback(this);
            this._onLoadCallback = null;
            this._realPath = null;
        };

        img.onerror = (err) => {
            Entry.Loader.removeQueue();
            if( this.loadState == LoadingState.DESTROYED ) return;
            if (!this._triedCnt) {
                if (Entry.type !== 'invisible') {
                    console.log('err=', this._picName, 'load failed');
                }
                this._triedCnt = 1;
                this._loadPath(this._realPath);
            } else if (this._triedCnt < 3) {
                this._triedCnt++;
                this._loadPath(Entry.mediaFilePath + '_1x1.png');
            } else {
                //prevent infinite call
                img.onerror = null;
            }
        };
        this._loadPath(this._realPath);
    }

    private _loadPath(path:string) {
        if(this.loadState == LoadingState.DESTROYED) return;
        Entry.Loader.addQueue();
        this._img.src = path;
    }

    get isReady() {
        return this.loadState == LoadingState.COMPLETE;
    }

    /** pictureModel.fileurl or pictureModel.filename **/
    get path():string { return this._rawPath; }

    private _getImageSrc(picture:IRawPicture) {
        if (picture.fileurl) return picture.fileurl;

        var fileName = picture.filename;
        return (
            Entry.defaultPath +
            '/uploads/' +
            fileName.substring(0, 2) +
            '/' +
            fileName.substring(2, 4) +
            '/image/' +
            fileName +
            '.png'
        );
    }

    destroy() {
        this.loadState = LoadingState.DESTROYED;
        this._destroyImage();
        if(this._canvas) {
            this._canvas = null;
        }

        this._rawPath = this._realPath = null;
    }

    private _destroyImage() {
        if(!this._img) return;
        this._img.onload = this._img.onerror = null;
        this._img = null;
    }

    private _resizeIfOversized() {
        var img:HTMLImageElement = this._img;
        var sw = img.naturalWidth || img.width;
        var sh = img.naturalHeight || img.height;
        this.srcWidth = sw;
        this.srcHeight = sh;
        var r = this._imgRect;

        if(r.scaleFactorX == 1 && r.scaleFactorY == 1) return;
        var sfx = r.scaleFactorX.toFixed(3);
        var sfy = r.scaleFactorY.toFixed(3);
        clog(`tex-rezie (${sw},${sh})->(${r.width},${r.height}). factor:(${sfx},${sfy})`);
        var canvas = PIXIHelper.getOffScreenCanvas();
        this.srcWidth = canvas.width = r.width;
        this.srcHeight = canvas.height = r.height;
        var ctx:CanvasRenderingContext2D = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img,0, 0, sw, sh,0, 0, r.width, r.height);
        return canvas;
    }
}
