import { ISceneTextures } from './ISceneTextures';
import { AtlasImageLoadingInfo } from './loader/AtlasImageLoadingInfo';
import { PrimitiveMap } from './structure/PrimitiveMap';
import { ImageRect } from '../../maxrect-packer/geom/ImageRect';
import { AtlasImageLoader } from './loader/AtlasImageLoader';
import { EntryTextureOption } from './EntryTextureOption';
import { EntryTexture } from './texture/EntryTexture';
import { EntryBaseTexture } from './texture/EntryBaseTexture';
import { EntryInterface } from '../utils/EntryInterface';
import { IRawPicture } from './model/IRawPicture';
import { PIXIAtlasHelper } from './PIXIAtlasHelper';
import { autoFit } from '../utils/AutoFit';


export class SceneTextures implements ISceneTextures {


    private _path_tex_map:PrimitiveMap<EntryTexture> = new PrimitiveMap();
    private _activated:boolean;


    constructor(public sceneID:string, private _option:EntryTextureOption, private _loader:AtlasImageLoader) {

    }

    _internal_imageRemoved():void {

    }

    activate():void {
        this._activated = true;
    }

    addPicInfo(pic:IRawPicture):void {
        let path = PIXIAtlasHelper.getRawPath(pic);
        let map = this._path_tex_map;
        if(map.hasValue(path)) return;
        let w = pic.dimension.width,
            h = pic.dimension.height;
        let rect:ImageRect = this._getNewImageRect(w, h );
        this._loader.load(pic, rect);
        let tex = this._newTexture(path, rect);

        map.add(path, tex);
    }


    private _newTexture(path:string, rect:ImageRect):EntryTexture {
        let baseTex:EntryBaseTexture = new EntryBaseTexture();
        baseTex.width = rect.width;
        baseTex.height = rect.height;
        baseTex.mipmap = this._option.mipmap;
        baseTex.scaleMode = this._option.scaleMode;
        let tex = new EntryTexture(baseTex, rect);
        this._path_tex_map.add(path, tex);
        return tex;
    }


    deactivate():void {
        this._activated = false;
    }


    getTexture(path:string):EntryTexture {
        return this._path_tex_map.getValue(path);
    }


    putImage(info:AtlasImageLoadingInfo, forceUpdateBaseTexture:boolean):void {
        let tex:EntryTexture = this._path_tex_map.getValue(info.path);
        if(!tex) {
            return;
        }
        let baseTex = tex.getBaseTexture();
        baseTex.updateSource(info.source());
        EntryInterface.requestUpdate();
    }


    destroy():void {

    }

    private _getNewImageRect(w:number, h:number):ImageRect {
        let r = new ImageRect(0,0, w, h);
        const TEX_MAX_SIZE_RECT = this._option.atlasOption.texMaxRect;
        if(w > TEX_MAX_SIZE_RECT.width || h > TEX_MAX_SIZE_RECT.height ) {
            autoFit.fit(TEX_MAX_SIZE_RECT, r, autoFit.ScaleMode.INSIDE, autoFit.AlignMode.TL);
            r.width = Math.ceil(r.width);
            r.height = Math.ceil(r.height);
            r.scaleFactor = w / r.width;
        }
        return r;
    }

}