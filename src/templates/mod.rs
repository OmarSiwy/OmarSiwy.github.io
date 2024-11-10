use askama::Template;

#[derive(Template)]
#[template(source = r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
</head>
<body>
    <h1>{{ heading }}</h1>
    <p>{{ description }}</p>
    <div id="wgpu-canvas" style="width: 800px; height: 600px;"></div>
</body>
</html>
"#, ext = "html")]
pub struct IndexTemplate<'a> {
    pub title: &'a str,
    pub heading: &'a str,
    pub description: &'a str,
}
