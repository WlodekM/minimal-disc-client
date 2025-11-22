import { Canvas, createCanvas, loadImage, Image } from '@napi-rs/canvas';
import fs from 'node:fs'
import sdl from '@kmamal/sdl';
import * as colors from './colors.js'
import font from './font.js';

const [width, height] = [600, 350];

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

function hexToBytes(hex) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

/** @type {{[K in keyof colors]: number[]}} */
const byteColors = Object.fromEntries(
	Object.entries(colors)
	.map(([name,value]) => [name,
		[...hexToBytes(value.slice(1,value.length-1)),255]
	])
)

// console.log()

const processedFont = [];
for (let id = 0; id < font.length; id++) {
	const char_data = font[id];
	const image_data = ctx.createImageData(8, 14)
	for (let y = 0; y < char_data.length; y++) {
		const row = char_data[y];
		const bits = [...Array(8)].map((x,i)=>row>>i&1);
		for (let x = 0; x < 8; x++) {
			// if (!bits[7-x])
			// 	continue;
			
			console.log(image_data.data, x, y, bits[7-x] ?
					byteColors.foreground :
					byteColors.background,
				(y * (8*4)) + x * 4)
			image_data.data.set(
				bits[7-x] ?
					byteColors.foreground :
					byteColors.background,
				(y * (8*4)) + x * 4
			)
		}
	}
	
	if (processedFont.length > 1){
		console.log(id)
		fs.writeFileSync('char.bin', image_data.data)
	throw 1;
}
	processedFont.push(image_data)
}

function makeWindow() {
	const config = {
		title: "simplecord",
		width: width,
		height: height,
		// borderless: true,
		resizable: false,
		// skipTaskbar: true
		// alwaysOnTop: true,
		//flags: sdl.video.POPUP_MENU, // or POPUP_MENU
		// flags: 0x0000000040000000

	}
	if (sdl.video?.createWindow)
		return sdl.video?.createWindow(config)
	return new sdl.Window(config)
}
const sdl_window = makeWindow();

/**
 * @template {any = string} T
 */
class Store {
	static _id = 0;
	/** @type {Map<number, (value: T) => void>} @private */
	listeners = new Map();
	/** @type {T} @readonly */
	value;
	/**
	 * @param {(value: T) => void} listener
	 * @returns {number}
	 */
	listen(listener) {
		const this_id = ++this._id;
		this.listeners.set(this_id, listener);
		return this_id
	}
	/**
	 * @param {number} id
	 */
	unlisten(id) {
		this.listeners.delete(id)
	}
	/**
	 * @param {T} value
	 */
	set(value) {
		this.value = value;
		for (const listener of this.listeners.values()) {
			listener(value);
		}
		return value;
	}
	/**
	 * @param {T} intial_value
	 */
	constructor(intial_value) {
		this.value = intial_value;
	}
}

class Rendering {
	/**
	 * @param {string} char
	 * @param {number} x
	 * @param {number} y
	 */
	static char(char, x, y) {
		const id = char.charCodeAt(0);
		if (id < 32 || id > 127)
			id = 63; // ?
		const charData = processedFont[id-32];
		console.log(charData)
		
		//TODO: specified color
		ctx.putImageData(charData, x, y)
		fs.writeFileSync('char.bin', charData.data)
		// ctx.fillStyle = colors.foreground;
		// for (let y_offset = 0; y_offset < charData.length; y_offset++) {
		// 	const row = charData[8-y_offset];
		// 	const bits = [...Array(8)].map((x,i)=>row>>i&1);
		// 	for (let x_offset = 0; x_offset < 8; x_offset++) {
		// 		if (!bits[7-x_offset])
		// 			continue;
		// 		ctx.fillRect(x+x_offset,y+y_offset,1,1);
		// 	}
		// }
	}
	/**
	 * @param {string} text
	 * @param {number} x
	 * @param {number} y
	 */
	static text(text, x, y) {
		for (let x_offset = 0; x_offset < text.length; x_offset++) {
			const char = text[x_offset];
			this.char(
				char,
				(x + (x_offset*9)), // 8 width + 1 px of padding
				y
			)
		}
	}
	static BG() {
		ctx.fillStyle = colors.background
		ctx.fillRect(0, 0, width, height)
	}
}

const stores = {
	page: new Store("test")
}

const pages = {
	test(delta) {
		Rendering.BG()
		Rendering.text(`g`, 1, 1);
	}
}

function render(delta) {
	const page = stores.page.value;
	(pages[page] ?? pages.test)(delta);
	const buffer = Buffer.from(ctx.getImageData(0, 0, width, height).data)
	// fs.writeFileSync('canvas.bin', buffer)
	sdl_window.render(width, height, width * 4, 'rgba32', buffer)
	setImmediate(render)
}

const targetFPS = 60;
const frameNs = BigInt(Math.round(1e9 / targetFPS));

let last = process.hrtime.bigint();

function loop() {
	const now = process.hrtime.bigint();
	const delta = Number(now - last) / 1e9;
	last = now;

	render(delta)

	const next = now + frameNs;

	const delay_ms = Number(next - process.hrtime.bigint()) / 1e6;

	if (delay_ms > 0) {
		setTimeout(loop, delay_ms);
	} else {
		setImmediate(loop);
	}
}

// loop();
render()

