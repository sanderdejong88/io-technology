const fs = require('fs-extra')
const path = require('path')
const matter = require('gray-matter')

const srcDir = path.resolve('data/blog')
const destDir = path.resolve('.tmp/blog')

const walk = function (dir, done) {
  let results = []
  fs.readdir(dir, function (err, list) {
    if (err) return done(err)
    let pending = list.length
    if (!pending) return done(null, results)
    list.forEach(function (file) {
      file = path.resolve(dir, file)
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res)
            if (!--pending) done(null, results)
          })
        } else {
          results.push(file)
          if (!--pending) done(null, results)
        }
      })
    })
  })
}

const fixImagePaths = (path) =>
  path.replaceAll('/articles/', 'https://techhub.iodigital.com/articles/')

walk(srcDir, function (err, results) {
  if (err) throw err

  const MAX_COPIED = 2
  let count = 0

  results.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8')
    let { data: frontmatter, content } = matter(source)

    if (frontmatter.canonicalUrl) return
    if (frontmatter.draft) return
    if (count >= MAX_COPIED) return
    count += 1

    frontmatter.title = frontmatter.title.replaceAll('_', '')
    if (frontmatter.images) {
      frontmatter.images = frontmatter.images.map((img) => fixImagePaths(img))
    }

    content = fixImagePaths(content)

    const distFile = file.replace(srcDir, destDir)
    const newFileContent = matter.stringify(content, frontmatter)

    fs.outputFileSync(distFile, newFileContent)
    console.log(`Copied ${distFile}`)
  })
})
