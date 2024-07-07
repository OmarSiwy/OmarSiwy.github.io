use AutoSimulate::run;

pub fn main() {
    pollster::block_on(run());
}
