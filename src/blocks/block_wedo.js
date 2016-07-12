"use strict";

Entry.Wedo = {
    name: 'wedo',
    MotorDirection: {
        MotorDirectionDrifting: 0,
        MotorDirectionLeft: 1,
        MotorDirectionRight: 2,
        MotorDirectionBraking: 3
    },
    defaultSensor: {
        Motor: {
            // Power 0~100
            Value: 0,
            Port: 0,
            Direction: 3
        },
        Piezo: {
            // 1 ~ 12
            Tone: 0,
            // 0 ~ 6
            Octave: 0,
            Duration: 0,
        },
        RGBLight: {
            // 1 ~ 10
            Color: 3
        }
    },
    setZero: function() {
        Entry.hw.sendQueue = $.extend(true, {}, this.defaultSensor);
        Entry.hw.update();
    },
};