use once_cell::sync::OnceCell;
use std::sync::Mutex;

pub mod task_state;

lazy_static! {
    pub static ref TASKS: Mutex<Vec<String>> = Mutex::new(vec![]);
}

pub fn init() {
    TASKS.set(Mutex::new(vec![])).expect("TASKS already initialized");
}

pub fn get_tasks() -> &'static Mutex<Vec<String>> {
    TASKS.get().expect("TASKS not initialized")
}
