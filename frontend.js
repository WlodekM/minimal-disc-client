// import { Rendering as _Rendering } from "./main-buff.js";

function nav(Rendering, stores) {
	if (['login'].includes(stores.page)) return;
	let x = 3;
	for (const name in pages) {
		if (name == '_default') continue;
		const text_length = 9 * name.length + 1;
		if (Rendering.button(x, Rendering.height - 17, name))
			stores.page = name
		x += text_length + 1;
	}
}
function render_logs(Rendering) {
	Rendering.text(logs.slice(0, 15).join('\n'), 0, 0, Rendering.colors.foreground, 'transparent');
}

/**
 * @param {typeof import('./main-buff.js').Rendering} Rendering 
 * @param {Record<string,any>} stores 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {string} store 
 */
function do_input(Rendering, stores, x, y, width, store) {
	if (!stores[store])
		stores[store] = '';
	if (stores[store+'_focus'] === undefined)
		stores[store+'_focus'] = false;

	Rendering.line(x+1, y, x+width+2, y, Rendering.colors.foreground)
	Rendering.line(x+1, y+Rendering.CHAR_HEIGHT+2, x+width+2, y+Rendering.CHAR_HEIGHT+2, Rendering.colors.foreground)
	Rendering.line(x, y, x, y+Rendering.CHAR_HEIGHT+3, Rendering.colors.foreground)
	Rendering.line(x+width+2, y, x+width+2, y+Rendering.CHAR_HEIGHT+3, Rendering.colors.foreground)

	if (stores.cursor) {
		stores[store+'_focus'] = Rendering.UI.touching(x, y, x+width+2, y+Rendering.CHAR_HEIGHT+3)
	}

	const focused = stores[store+'_focus'];
	Rendering
}

/** @type {Record<string, (Rendering: typeof import('./main-buff.js').Rendering, stores: Record<string,any>, delta: number) => void>} */
export const pages = {
	// test(Rendering, _strores, delta) {
	// 	Rendering.BG()
	// 	Rendering.text(`meow meow meow abcdefghijklmnop ${delta}`, 1, 1);
	// 	Rendering.line(0, 15, Rendering.width, 15, Rendering.colors.foreground)
	// 	Rendering.line(0, 0, Rendering.width-1, Rendering.height-1, Rendering.colors.foreground)
	// 	// for (let x = 0; x < Rendering.height; x++) {
	// 	// 	Rendering.dot(x, x, [255, 0, 255, 255])
	// 	// }
	// },
	// colors(Rendering) {
	// 	Rendering.BG();
	// 	let x = 0;
	// 	let y = 0;
	// 	for (const color_name in Rendering.colors) {
	// 		if (color_name.length*9+1+x > Rendering.width) {
	// 			x = 0;
	// 			y+=15
	// 		}
	// 		const color = Rendering.colors[color_name]
	// 		// console.log(x, y, color_name)
	// 		Rendering.fill(x, y, color_name.length*9+1+x, y+14, color);
	// 		const [dx, dy] = Rendering.text(color_name, x, y, Rendering.colors.foreground, color);
	// 		x += dx*9-7;
	// 		y += dy*14;
	// 	}
	// },
	// circle(Rendering, stores) {
	// 	Rendering.BG()
	// 	function d(offset) {
	// 		const x = Math.round(Math.sin(Date.now()/100+offset) * 60 + (Rendering.width / 2));
	// 		const y = Math.round(Math.cos(Date.now()/100+offset) * 60 + (Rendering.height / 2));
	// 		Rendering.fill(x-5, y-5, x+5, y+5, Rendering.colors.foreground)
	// 	}
	// 	d(0)
	// 	d(2)
	// 	d(4)
	// 	d(6);
	// 	const [mx, my] = stores.cursor;
	// 	if (mx >5 && my > 5)
	// 		Rendering.fill(mx-5, my-5, mx+5, my+5, Rendering.colors.foreground);
	// },
	// stores(Rendering, stores) {
	// 	Rendering.BG();
	// 	let x = 0, y = 0;
	// 	for (const key in stores) {
	// 		if (Object.prototype.hasOwnProperty.call(stores, key)) {
	// 			const value = stores[key];
	// 			if (typeof value == 'object') continue;
	// 			const [dx, dy] = Rendering.text(key, x, y);
	// 			// x += dx;
	// 			y += 16;
	// 			if (typeof value == 'boolean') {
	// 				Rendering.switch(x, y, value)
	// 				y += 20;
	// 			}
	// 		}
	// 	}
	// },
	// time(Rendering) {
	// 	Rendering.BG();
	// 	Rendering.text(`${new Date()}`, 1, 1, Rendering.colors.Cyan, Rendering.colors.background, true);
	// 	Rendering.text(`${pages.time.toString()}`, 1, 17, Rendering.colors.Magenta, Rendering.colors.background, true);
	// }
	_default(Rendering, stores) {
		Rendering.BG();
		stores.page = 'login';
		stores = {
			...stores,
			username: '',
			token: '',
		}
	},
	login(Rendering, stores) {
		Rendering.BG()
		Rendering.text('log in', 9, 0, Rendering.colors.foreground)
		const line_y = Rendering.CHAR_HEIGHT+3;
		Rendering.line(9, line_y, Rendering.width, line_y, Rendering.colors.foreground)
		do_input(Rendering, stores, 9, line_y+3, 9*20)
	}
}
export function _common(Rendering, stores, delta) {
	if (stores.logs)
		render_logs(Rendering);
	if (stores.keys_pressed.l)
		stores.logs = !stores.logs
	const fps = Math.round(1 / delta);
	const fps_text = `FPS: ${fps}`;
	Rendering.text(fps_text, Rendering.width - (fps_text.length * 9), 0)
	nav(Rendering, stores);
}
