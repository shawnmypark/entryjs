Entry.Comment = class Comment {
    dragMode = Entry.DRAG_MODE_NONE;
    offsetX = 50;
    offsetY = 10;
    schema = {
        id: null,
        x: 0,
        y: 0,
        parentWidth: 0,
        parentHeight: 0,
        width: 160,
        height: 160,
        value: '',
        readOnly: false,
        visible: true,
        display: true,
        movable: true,
        isOpened: true,
        deletable: Entry.Block.DELETABLE_TRUE,
    };

    constructor(schema, board, block) {
        Entry.Model(this, false);

        if (schema) {
            this.set(schema);
        }
        this._block = block;
        const { view } = block || {};
        this._blockView = view;
        if (board) {
            this.createComment(board, schema);
        }
        this.magnet = {};
    }

    get block() {
        return this._block;
    }

    get board() {
        return this._board;
    }

    get blockView() {
        return this._blockView;
    }

    get view() {
        return this;
    }

    get defaultLineLength() {
        return 40;
    }

    get titleHeight() {
        return 22;
    }

    get scale() {
        return this.board.scale || 1;
    }

    get fontSize() {
        return this.scale * 10;
    }

    get value() {
        return this.value;
    }

    get thread() {
        return this._thread;
    }

    get code() {
        return this.board.getCode();
    }

    get textAreaPath() {
        let d = '';
        let { width, height } = this;
        width = Math.max(width, 100);
        height = Math.max(height, 100);

        for (let y = 14; y < height - this.titleHeight - 4; y += 16) {
            d += `M6,${y} H${width - 12} `;
        }
        return d;
    }

    get titleTextAreaPath() {
        return `M22,14 H${this.width - 22}`;
    }

    generateId(schema = {}) {
        const id = schema.id || Entry.Utils.generateId();
        this.set({ id });
    }

    createComment(board, schema) {
        if (board) {
            this._board = board;
        }
        const { svgGroup, pathGroup } = this.blockView || {};
        this.pathGroup = pathGroup;
        this.parentGroup = svgGroup;
        if (this.block) {
            this.svgGroup = this.blockView.svgCommentGroup.prepend('g');
        } else {
            this.svgGroup = this.board.svgCommentGroup.elem('g');
        }
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.resizeMouseDown = this.resizeMouseDown.bind(this);
        this.resizeMouseMove = this.resizeMouseMove.bind(this);
        this.resizeMouseUp = this.resizeMouseUp.bind(this);
        this.toggleMouseDown = this.toggleMouseDown.bind(this);
        this.toggleMouseUp = this.toggleMouseUp.bind(this);

        this.startRender();
        if (schema) {
            this.initSchema(schema);
        }
        this.setFrame();
        this.addControl();
        this.code.registerBlock(this);
        this.setObservers();
    }

    startRender() {
        if (this.block) {
            this._line = this.svgGroup.elem('line');
        }

        this._contentGroup = this.svgGroup.elem('g');
        this._comment = this._contentGroup.elem('rect');
        this._path = this._contentGroup.elem('defs').elem('path');
        this._text = this._contentGroup.elem('text');
        this._textPath = this._text.elem('textPath');
        this._resizeArrow = this._contentGroup.elem('image');
        this._resizeArea = this._contentGroup.elem('rect');

        this._title = this.svgGroup.elem('rect');
        this._titleGroup = this.svgGroup.elem('g');
        this._toggleArrow = this._titleGroup.elem('image');
        this._titlePath = this._titleGroup.elem('defs').elem('path');
        this._titleText = this._titleGroup.elem('text');
        this._titleTextPath = this._titleText.elem('textPath');

        this._commentIcon = this.svgGroup.elem('image');
        this._toggleArea = this.svgGroup.elem('rect');

        this.canRender = true;
    }

    initSchema(schema = {}) {
        let parentWidth = 0;
        let parentHeight = 0;
        this.generateId(schema);
        let { titleHeight, defaultLineLength } = this;
        if (this.pathGroup) {
            parentWidth = this.pathGroup.getBBox().width;
            const { topFieldHeight, height } = this._blockView;
            parentHeight = topFieldHeight || height;
        } else {
            titleHeight = -60;
            defaultLineLength = 50;
        }
        const x = parentWidth + defaultLineLength;
        const y = parentHeight / 2 - titleHeight / 2;

        schema.x = schema.x || x;
        schema.y = schema.y || y;
        schema.parentWidth = schema.parentWidth || parentWidth;
        schema.parentHeight = schema.parentHeight || parentHeight;
        schema.width = schema.width || 160;
        schema.height = schema.height || 160;
        this.set(schema);
    }

    setFrame() {
        this._comment.attr({
            stroke: '#EDA913',
            fill: '#FFDA85',
            rx: '4',
        });

        this._title.attr({
            stroke: '#EDA913',
            fill: '#FBB315',
            rx: '4',
        });

        if (this.block) {
            this._line.attr({
                style: 'stroke:#eda913;stroke-width:2',
            });
        }

        this._path.attr({
            id: `${this.id}c`,
            stroke: 'red',
        });

        this._titlePath.attr({
            id: `${this.id}t`,
        });

        this._text.attr({
            'font-size': 10,
        });

        this._titleText.attr({
            'font-size': 10,
            fill: 'white',
            'font-weight': 'bold',
            class: 'invisible',
        });

        this._textPath.attr({
            href: `#${this.id}c`,
        });

        this._titleTextPath.attr({
            href: `#${this.id}t`,
        });

        const path = `${Entry.mediaFilePath}block_icon/comment/`;

        this._resizeArea.attr({
            width: 20,
            height: 20,
            fill: 'transparent',
            class: 'entry-comment-resize-arrow',
        });

        this._resizeArrow.attr({
            href: `${path}resize_arrow.svg`,
        });

        this._toggleArea.attr({
            y: this.y,
            width: 20,
            height: this.titleHeight,
            fill: 'transparent',
            class: 'entry-comment-toggle-arrow',
        });

        this._toggleArrow.attr({
            href: `${path}toggle_open_arrow.svg`,
        });

        this._commentIcon.attr({
            href: `${path}comment_icon.svg`,
        });
    }

    setPosition() {
        if (!this.visible) {
            return;
        }
        const { x, y } = this;
        let width = Math.max(this.width, 100);
        let rx = 4;
        const height = Math.max(this.height, 100);
        if (!this.isOpened && this.block) {
            width = 22;
            rx = 11;
        }

        this._title.attr({
            x,
            y,
            rx,
            width,
            height: this.titleHeight,
        });

        this._comment.attr({
            x,
            y,
            width,
            height,
        });

        if (this.block) {
            this._line.attr({
                x1: this.parentWidth,
                y1: this.parentHeight / 2,
                x2: x + width / 2,
                y2: y + this.titleHeight / 2,
            });
        }

        this._path.attr({
            transform: `translate(${x}, ${y + this.titleHeight})`,
            d: this.textAreaPath,
        });

        this._titlePath.attr({
            transform: `translate(${x}, ${y})`,
            d: this.titleTextAreaPath,
        });

        this._resizeArea.attr({
            x: x + width - 20,
            y: y + height - 20,
        });

        this._resizeArrow.attr({
            x: x + width - 14,
            y: y + height - 14,
        });

        this._toggleArea.attr({
            y,
            x: x + width - 20,
            height: this.titleHeight,
        });

        this._toggleArrow.attr({
            x: x + width - 16,
            y: y + 8,
        });

        this._commentIcon.attr({
            x: x + 5,
            y: y + 5,
        });
    }

    setObservers() {
        this._observers = [];
        this._observers.push(this.observe(this, 'updateOpacity', ['visible'], false));
        this._observers.push(this.observe(this, 'toggleContent', ['isOpened']));
        this._observers.push(this.observe(this, 'setValue', ['value']));
        this._observers.push(
            this.observe(this, 'setPosition', [
                'x',
                'y',
                'width',
                'height',
                'parentWidth',
                'parentHeight',
                'isOpened',
            ])
        );
    }

    updatePos() {
        this.set({
            x: this.moveX,
            y: this.moveY,
        });
    }

    updateParentPos() {
        if (this.pathGroup) {
            const { width: parentWidth } = this.pathGroup.getBBox();
            const { topFieldHeight, height } = this._blockView;
            const parentHeight = topFieldHeight || height;
            const { parentWidth: beforeParentWidth, parentHeight: beforeParentHeight } = this;
            const defferenceWidth = parentWidth - beforeParentWidth;
            const defferenceHeight = parentHeight - beforeParentHeight;

            if (defferenceWidth || defferenceHeight) {
                let { x, y } = this;
                x += defferenceWidth;
                y += defferenceHeight;

                this.set({
                    x,
                    y,
                    parentWidth,
                    parentHeight,
                });
            }
        }
    }

    moveTo(x, y) {
        if (!this.display) {
            this.set({ x: -99999, y: -99999 });
        } else {
            this.set({ x, y });
        }
    }

    moveBy(x, y) {
        return this.moveTo(this.x + x / this.scale, this.y + y / this.scale);
    }

    resize(x, y) {
        this.set({
            width: this.width + x,
            height: this.height + y,
        });
    }

    setDragInstance(e) {
        const mouseEvent = Entry.Utils.convertMouseEvent(e);
        const matrix = this.svgGroup.getCTM();
        const { x, y } = Entry.GlobalSvg.getRelativePoint(matrix);
        const { left: startX, top: startY } = (this.pathGroup &&
            this.pathGroup.getBoundingClientRect()) || { left: x, top: y };
        this.mouseDownCoordinate = {
            x: mouseEvent.pageX,
            y: mouseEvent.pageY,
            parentX: x,
            parentY: y,
        };
        this.dragInstance = new Entry.DragInstance({
            startX,
            startY,
            offsetX: mouseEvent.pageX,
            offsetY: mouseEvent.pageY,
            mode: true,
        });
    }

    bindDomEvent(mouseMove, mouseUp) {
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('touchmove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('touchend', mouseUp);
    }

    removeDomEvent(mouseMove, mouseUp) {
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('touchmove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('touchend', mouseUp);
    }

    getMouseMoveDiff(mouseEvent) {
        return Math.sqrt(
            Math.pow(mouseEvent.pageX - this.mouseDownCoordinate.x, 2) +
                Math.pow(mouseEvent.pageY - this.mouseDownCoordinate.y, 2)
        );
    }

    mouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        let longPressTimer = null;

        if (
            (e.button === 0 || (e.originalEvent && e.originalEvent.touches)) &&
            !this.board.readOnly
        ) {
            this.setDragInstance(e);
            this.dragMode = Entry.DRAG_MODE_MOUSEDOWN;
            this.bindDomEvent(this.mouseMove, this.mouseUp);
            const eventType = e.type;
            this.board.set({ dragBlock: this });

            if (eventType === 'touchstart') {
                longPressTimer = setTimeout(function() {
                    if (longPressTimer) {
                        longPressTimer = null;
                        this.mouseUp();
                        this._rightClick(e);
                    }
                }, 1000);
            }
        } else if (Entry.Utils.isRightButton(e)) {
            this.rightClick(e);
        }
    }

    rightClick(e) {
        const disposeEvent = Entry.disposeEvent;
        if (disposeEvent) {
            disposeEvent.notify(e);
        }

        const { clientX: x, clientY: y } = Entry.Utils.convertMouseEvent(e);

        const board = this.board;
        return Entry.ContextMenu.show(_getOptions(this), null, { x, y });

        function _getOptions(comment) {
            const readOnly = comment.readOnly;

            const copyAndPaste = {
                text: '메모 복사 & 붙여넣기',
                enable: !readOnly,
                callback() {
                    Entry.do('cloneComment', comment.copy(), board);
                },
            };

            const copy = {
                text: '메모 복사하기',
                enable: !readOnly,
                callback() {
                    comment.copyToClipboard();
                },
            };

            const remove = {
                text: '메모 삭제하기',
                enable: !readOnly,
                callback() {
                    Entry.do('removeComment', comment);
                },
            };

            const toggle = {
                text: comment.isOpened ? '메모 접기' : '메모 열기',
                enable: !readOnly,
                callback() {
                    Entry.do('toggleComment', comment);
                },
            };

            const seperate = {
                text: '메모 분리하기',
                enable: !!comment.block,
                callback() {
                    Entry.do('separateComment', comment);
                },
            };

            const options = [copyAndPaste, copy, remove, toggle, seperate];

            return options;
        }
    }

    mouseMove(e) {
        e.stopPropagation();
        const mouseEvent = Entry.Utils.convertMouseEvent(e);
        if (
            this.dragMode === Entry.DRAG_MODE_DRAG ||
            this.getMouseMoveDiff(mouseEvent) > Entry.BlockView.DRAG_RADIUS
        ) {
            if (this.isEditing) {
                this.destroyTextArea();
            }
            const workspaceMode = this.board.workspace.getMode();
            if (this.dragMode !== Entry.DRAG_MODE_DRAG) {
                this.moveX = this.x;
                this.moveY = this.y;
                this.dragMode = Entry.DRAG_MODE_DRAG;
                Entry.GlobalSvg.setComment(this, workspaceMode);
                this.visible && this.set({ visible: false });
            }

            this.moveX += mouseEvent.pageX - this.dragInstance.offsetX;
            this.moveY += mouseEvent.pageY - this.dragInstance.offsetY;

            this.dragInstance.set({
                offsetX: mouseEvent.pageX,
                offsetY: mouseEvent.pageY,
            });
            Entry.GlobalSvg.commentPosition(this.dragInstance);
        }
    }

    mouseUp(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!this.isEditing && this.isOpened && this.dragMode === Entry.DRAG_MODE_MOUSEDOWN) {
            this.renderTextArea();
        } else {
            this.destroyTextArea();
            Entry.do('moveComment', this);
        }
        if (this.board) {
            this.board.set({ dragBlock: null });
        }
        this.removeMoveSetting(this.mouseMove, this.mouseUp);
    }

    removeMoveSetting(mouseMove, mouseUp) {
        this.dragMode = Entry.DRAG_MODE_NONE;
        this.board.set({ dragBlock: null });
        this.set({ visible: true });
        this.setPosition();
        this.removeDomEvent(mouseMove, mouseUp);
        const gs = Entry.GlobalSvg;
        const gsRet = gs.terminateDrag(this);
        if (gsRet === gs.REMOVE) {
            Entry.do('removeComment', this).isPass(true, true);
        }
        Entry.GlobalSvg.remove();
        delete this.mouseDownCoordinate;
        delete this.dragInstance;
    }

    addControl() {
        const bindEvent = (dom, func) => {
            dom.addEventListener('mousedown', func);
            dom.addEventListener('ontouchstart', func);
        };
        bindEvent(this._contentGroup, this.mouseDown);
        bindEvent(this._title, this.mouseDown);
        bindEvent(this._titleGroup, this.mouseDown);
        bindEvent(this._resizeArea, this.resizeMouseDown);
        bindEvent(this._toggleArea, this.toggleMouseDown);
    }

    updateOpacity() {
        this.visible
            ? Entry.Utils.removeClass(this.svgGroup, 'invisible')
            : Entry.Utils.addClass(this.svgGroup, 'invisible');
    }

    isReadOnly() {
        return this.readOnly;
    }

    getBoard() {
        return this.board;
    }

    getAbsoluteCoordinate(dragMode = this.dragMode) {
        const scale = this.scale;
        let pos = null;
        let parentX = 0;
        let parentY = 0;
        if (this.mouseDownCoordinate) {
            parentX = this.mouseDownCoordinate.parentX;
            parentY = this.mouseDownCoordinate.parentY;
        }
        if (dragMode === Entry.DRAG_MODE_DRAG) {
            pos = {
                x: this.moveX,
                y: this.moveY,
                scaleX: this.moveX + parentX / scale,
                scaleY: this.moveY + parentY / scale,
            };
        } else {
            pos = this.getThread().view.requestAbsoluteCoordinate(this);
            pos.x += this.x;
            pos.y += this.y;
            pos.scaleX = pos.x / scale;
            pos.scaleY = pos.y / scale;
        }
        return pos;
    }

    renderTextArea() {
        this.isEditing = true;
        const { top, left } = this._comment.getBoundingClientRect();
        this.event = Entry.disposeEvent.attach(this, () => {
            this._textPath.textContent = this.value;
            this.destroyTextArea();
        });
        this.textArea = Entry.Dom('textarea', {
            class: 'entry-widget-textarea',
            parent: $('body'),
        });
        this.bindDomEventTextArea();
        this.textArea.val(this.value);
        this.textArea.css({
            left: left - (1 - this.scale) * 0.2 + 2,
            top: this.titleHeight * this.scale + top + 1,
            'font-size': `${this.fontSize}px`,
            width: (this.width - 16) * this.scale,
            height: (this.height - this.titleHeight - 10) * this.scale,
            border: `${this.scale}px solid transparent`,
            'border-radius': `0 0 ${4 * this.scale}px ${4 * this.scale}px`,
            padding: `${2 * this.scale}px ${4 * this.scale}px`,
        });
        this.textArea.focus && this.textArea.focus();
    }

    bindDomEventTextArea() {
        this.textArea.on('mousedown', (e) => {
            e.stopPropagation();
        });
        const exitKeys = [13, 27];
        this.textArea.on('keypress', (e) => {
            if (_.includes(exitKeys, e.keyCode || e.which)) {
                e.preventDefault();
            }
        });
        this.textArea.on('keyup', (e) => {
            if (_.includes(exitKeys, e.keyCode || e.which)) {
                this.destroyTextArea();
                this.isEditing = false;
            }
        });
        this.textArea.one('blur', () => {
            this.destroyTextArea();
            this.isEditing = false;
        });
    }

    destroyTextArea() {
        this.isEditing = false;

        this.event && this.event.destroy();
        delete this.event;

        if (this.textArea) {
            this.textArea.remove();
            const value = this.textArea.val();
            if (this.value !== value) {
                Entry.do('writeComment', this, value);
            }
            delete this.textArea;
        }

        Entry.Utils.blur();
    }

    writeComment(value) {
        this.set({ value });
    }

    setValue() {
        this._textPath.textContent = this.value;
        this._titleTextPath.textContent = this.value;
    }

    resizeMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.button === 0 || (e.originalEvent && e.originalEvent.touches)) {
            this.setDragInstance(e);
            this.dragMode = Entry.DRAG_MODE_MOUSEDOWN;
            this.bindDomEvent(this.resizeMouseMove, this.resizeMouseUp);
        } else if (Entry.Utils.isRightButton(e)) {
            this.rightClick(e);
        }
    }

    resizeMouseMove(e) {
        e.stopPropagation();

        const mouseEvent = Entry.Utils.convertMouseEvent(e);
        if (
            this.dragMode === Entry.DRAG_MODE_DRAG ||
            this.getMouseMoveDiff(mouseEvent) > Entry.BlockView.DRAG_RADIUS
        ) {
            if (this.dragMode !== Entry.DRAG_MODE_DRAG) {
                this.dragMode = Entry.DRAG_MODE_DRAG;
            }
            this.resize(
                (mouseEvent.pageX - this.dragInstance.offsetX) / this.scale,
                (mouseEvent.pageY - this.dragInstance.offsetY) / this.scale
            );

            this.dragInstance.set({
                offsetX: mouseEvent.pageX,
                offsetY: mouseEvent.pageY,
            });
        }
    }

    resizeMouseUp(e) {
        e.preventDefault();
        e.stopPropagation();

        this.set({
            width: Number(this._comment.getAttribute('width')),
            height: Number(this._comment.getAttribute('height')),
        });

        this.removeMoveSetting(this.resizeMouseMove, this.resizeMouseUp);
    }

    toggleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.button === 0 || (e.originalEvent && e.originalEvent.touches)) {
            this.setDragInstance(e);
            this.dragMode = Entry.DRAG_MODE_MOUSEDOWN;
            this.bindDomEvent(this.mouseMove, this.toggleMouseUp);
        } else if (Entry.Utils.isRightButton(e)) {
            this.rightClick(e);
        }
    }

    toggleMouseUp(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.dragMode === Entry.DRAG_MODE_MOUSEDOWN) {
            Entry.do('toggleComment', this);
        } else {
            Entry.do('moveComment', this, this.x, this.y);
        }
        this.removeMoveSetting(this.mouseMove, this.toggleMouseUp);
    }

    toggleContent() {
        const path = `${Entry.mediaFilePath}block_icon/comment/`;
        let fileName;
        if (this.isOpened) {
            Entry.Utils.removeClass(this._contentGroup, 'invisible');
            Entry.Utils.addClass(this._titleText, 'invisible');
            Entry.Utils.removeClass(this._titleGroup, 'invisible');
            fileName = 'toggle_open_arrow.svg';
        } else {
            if (this._block) {
                Entry.Utils.addClass(this._titleGroup, 'invisible');
            }
            Entry.Utils.addClass(this._contentGroup, 'invisible');
            Entry.Utils.removeClass(this._titleText, 'invisible');
            fileName = 'toggle_close_arrow.svg';
            this.destroyTextArea();
        }
        this._toggleArrow.attr({
            href: path + fileName,
        });
    }

    setThread(thread) {
        this._thread = thread;
    }

    getThread() {
        let thread;
        if (this.block) {
            thread = this.block.getThread();
        } else {
            thread = this.thread;
        }
        return thread;
    }

    copy() {
        const cloned = this.toJSON(true);

        const { x, y } = this.getAbsoluteCoordinate();
        cloned.x = x + 15;
        cloned.y = y + 15;
        cloned.id = Entry.Utils.generateId();
        cloned.type = 'comment';

        return cloned;
    }

    copyToClipboard() {
        Entry.clipboard = this.copy();
    }

    connectToBlock(block) {
        const data = this.toJSON();
        delete data.x;
        delete data.y;
        this.destroy(block);
        block.connectComment(new Entry.Comment(data, this.board, block));
    }

    separateFromBlock() {
        const data = this.toJSON();
        const { x, y } = this.getAbsoluteCoordinate();
        const board = this.board;
        data.x = x;
        data.y = y;
        this.destroy();
        const comment = new Entry.Comment(data, board);
        this.board.code.createThread([comment], 0);
    }

    destroy() {
        this.removeControl();
        this.destroyView();
        this._destroyObservers();
        if (this.block) {
            delete this.block.disconnectComment();
        } else {
            this.board.code.destroyThread(this.thread);
        }
        this.code.unregisterBlock(this);
    }

    isInOrigin() {
        return false;
    }

    reDraw() {}

    destroyView() {
        this.svgGroup.remove();
    }

    _destroyObservers() {
        const observers = this._observers;
        while (observers.length) {
            observers.pop().destroy();
        }
    }

    removeControl() {
        const destroyEvent = (dom, func) => {
            dom.removeEventListener('mousedown', func);
            dom.removeEventListener('ontouchstart', func);
        };
        destroyEvent(this._contentGroup, this.mouseDown);
        destroyEvent(this._title, this.mouseDown);
        destroyEvent(this._resizeArea, this.resizeMouseDown);
        destroyEvent(this._toggleArea, this.toggleMouseDown);
    }

    isDeletable() {
        return this.deletable;
    }

    getCode() {
        return this.code;
    }

    toJSON() {
        const json = this._toJSON();
        json.type = 'comment';
        return json;
    }
};
