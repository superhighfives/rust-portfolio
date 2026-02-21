use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ScrollEngine {
    scroll_target: f32,
    scroll_current: f32,
    scroll_velocity: f32,
    scroll_max: f32,
    ease_factor: f32,
}

#[wasm_bindgen]
impl ScrollEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ScrollEngine {
        ScrollEngine {
            scroll_target: 0.0,
            scroll_current: 0.0,
            scroll_velocity: 0.0,
            scroll_max: 0.0,
            ease_factor: 0.12,
        }
    }

    pub fn set_scroll_target(&mut self, y: f32) {
        self.scroll_target = y.clamp(0.0, self.scroll_max);
    }

    pub fn set_scroll_current(&mut self, y: f32) {
        self.scroll_current = y;
        self.scroll_velocity = 0.0;
    }

    pub fn set_scroll_max(&mut self, max: f32) {
        self.scroll_max = if max > 0.0 { max } else { 0.0 };
    }

    pub fn scroll_current(&self) -> f32 {
        self.scroll_current
    }

    pub fn scroll_velocity(&self) -> f32 {
        self.scroll_velocity
    }

    pub fn tick(&mut self) {
        let diff = self.scroll_target - self.scroll_current;
        let delta = diff * self.ease_factor;
        self.scroll_velocity = delta;
        self.scroll_current += delta;
    }
}
