use wasm_bindgen::prelude::*;

fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

#[wasm_bindgen]
pub struct AnimationEngine {
    // x, y pairs: [x0, y0, x1, y1, ...]
    positions: Vec<f32>,
    velocities: Vec<f32>,
    home_positions: Vec<f32>,
    count: usize,
    spring_stiffness: f32,
    damping: f32,
    mouse_radius: f32,
    mouse_strength: f32,
}

#[wasm_bindgen]
impl AnimationEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(count: usize, width: f32, height: f32) -> AnimationEngine {
        let mut positions = Vec::with_capacity(count * 2);
        let mut home_positions = Vec::with_capacity(count * 2);
        let velocities = vec![0.0; count * 2];

        // Distribute particles in a grid-like pattern with some randomness
        // Use a simple pseudo-random based on index
        for i in 0..count {
            let seed = i as f32;
            let px = pseudo_random(seed * 1.1) * width;
            let py = pseudo_random(seed * 2.3 + 100.0) * height;
            positions.push(px);
            positions.push(py);
            home_positions.push(px);
            home_positions.push(py);
        }

        AnimationEngine {
            positions,
            velocities,
            home_positions,
            count,
            spring_stiffness: 0.015,
            damping: 0.92,
            mouse_radius: 150.0,
            mouse_strength: 8.0,
        }
    }

    pub fn update(&mut self, dt: f32, mouse_x: f32, mouse_y: f32) {
        // Clamp dt to avoid instability on tab-switch / long frames
        let dt = if dt > 0.1 { 0.1 } else { dt };
        let dt_scale = dt * 60.0; // Normalize to ~60fps baseline

        for i in 0..self.count {
            let ix = i * 2;
            let iy = ix + 1;

            let px = self.positions[ix];
            let py = self.positions[iy];
            let hx = self.home_positions[ix];
            let hy = self.home_positions[iy];

            // Spring force toward home position
            let spring_fx = (hx - px) * self.spring_stiffness;
            let spring_fy = (hy - py) * self.spring_stiffness;

            // Mouse repulsion
            let dx = px - mouse_x;
            let dy = py - mouse_y;
            let dist_sq = dx * dx + dy * dy;
            let radius_sq = self.mouse_radius * self.mouse_radius;

            let (mouse_fx, mouse_fy) = if dist_sq < radius_sq && dist_sq > 0.01 {
                let dist = dist_sq.sqrt();
                let force = (1.0 - dist / self.mouse_radius) * self.mouse_strength;
                let nx = dx / dist;
                let ny = dy / dist;
                (nx * force, ny * force)
            } else {
                (0.0, 0.0)
            };

            // Apply forces to velocity
            self.velocities[ix] += (spring_fx + mouse_fx) * dt_scale;
            self.velocities[iy] += (spring_fy + mouse_fy) * dt_scale;

            // Damping
            self.velocities[ix] *= self.damping;
            self.velocities[iy] *= self.damping;

            // Update position using lerp-style integration
            self.positions[ix] = lerp(px, px + self.velocities[ix], dt_scale);
            self.positions[iy] = lerp(py, py + self.velocities[iy], dt_scale);
        }
    }

    pub fn resize(&mut self, width: f32, height: f32) {
        for i in 0..self.count {
            let ix = i * 2;
            let iy = ix + 1;
            let seed = i as f32;
            let px = pseudo_random(seed * 1.1) * width;
            let py = pseudo_random(seed * 2.3 + 100.0) * height;
            self.home_positions[ix] = px;
            self.home_positions[iy] = py;
        }
    }

    pub fn positions_ptr(&self) -> *const f32 {
        self.positions.as_ptr()
    }

    pub fn velocities_ptr(&self) -> *const f32 {
        self.velocities.as_ptr()
    }

    pub fn len(&self) -> usize {
        self.count
    }
}

/// Simple pseudo-random hash function (deterministic, seeded by float)
fn pseudo_random(seed: f32) -> f32 {
    let s = (seed * 12.9898 + 78.233).sin() * 43758.5453;
    s - s.floor()
}
