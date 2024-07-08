use portfolio::run;

pub fn main() {
    pollster::block_on(run());
}
