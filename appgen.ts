/*
 * Create a startup script for launching on the files in ROUTES_DIR or the
 * specified routing directory. Cribbed from the Python Flask appgen and
 * the express-file-routing npm package.
 */

const fs = require("fs")
const os = require("os")
const path = require("path")
const util = require("util")
import process = require("process")

/* We only look for *.js files. If your source is in JSX, TS, or TSX,
   compile it into JS first! */
const JS_EXT = ".js"
const DEFAULT_NAME = "app"
const HEAD_SUFF = "_head"
const TAIL_SUFF = "_tail"
const ROUTES_DIR = "routes"
const STATIC_DIR = "static"

/* We write routes on *.html, not *.js, *.jsx, *.tsx, etc. Looks more like
   a normal web server */
const ROUTE_EXT = ".html"

const ROUTE_SEP = "/"
const INDEX = "index"  /* should be lowercase */
const HIDDEN = "."
const UTF8 = "utf8"
const MYNAME = path.basename(process.argv[1], JS_EXT)
const WRITE_OPTS = { encoding: UTF8 }

const HTTP_METHODS = ["get", "head", "post", "put", "delete", "connect",
    "options", "trace", "patch"]

const PORT = 3000

function processJsFiles(dir: string, callback: (string) => void): void {
    for (const fileName of fs.readdirSync(dir)) {
        if (fileName.startsWith(HIDDEN)) {
            continue;
        }
        let filePath = path.join(dir, fileName)
        if (fs.lstatSync(filePath).isDirectory()) {
            processJsFiles(filePath, callback)
        } else if (path.parse(fileName).ext == JS_EXT && fs.statSync(filePath).isFile()) {
            callback(filePath)
        }
    }
}

function makeRoutes(dir: string): void {
    const prefixLen = values.route.length + path.sep.length

    function getRpath(filePath: string): string {
        let rpath = filePath.substr(prefixLen)
        if (path.sep !== ROUTE_SEP) {
            let pat = new RegExp("\\" + path.sep, "g")
            rpath = rpath.replace(pat, ROUTE_SEP)
        }
        if (!rpath.startsWith(ROUTE_SEP)) {
                rpath = ROUTE_SEP + rpath
        }
        if (rpath.endsWith(JS_EXT)) {
            rpath = rpath.substr(0, rpath.length - JS_EXT.length) + ROUTE_EXT
        }
        return values.prefix + rpath
    }

    function makeOneRoute(filePath: string): void {
        const mpath = "." + path.sep + filePath
        const module = require(mpath)
        let written = false
        let buf = ""
        for (const method of HTTP_METHODS) {
            if (!(method in module)) {
                continue
            }
            const attrib = module[method]
            if (typeof(attrib) != "function") {
                continue
            }
            if (!written) {
                var mangled = "_" + filePath.replace(/[^\p{L}\p{N}_]/ug, "_")
                buf += `const ${mangled} = require(${quote(mpath)});\n`
                written = true
            }
            const rpath = getRpath(filePath)
            if (rpath.endsWith("/" + INDEX + ROUTE_EXT)) {
                const dpath = rpath.substr(0, rpath.length - INDEX.length - ROUTE_EXT.length)
                buf += `app.${method}(${quote(dpath)}, ${mangled}.${method});\n`
            }
            buf += `app.${method}(${quote(rpath)}, ${mangled}.${method});\n\n`
            fs.writeFileSync(output, buf, WRITE_OPTS)
        }
    }

    processJsFiles(values.route, makeOneRoute)
}

const BSMAP = new Map()
BSMAP.set("\"", '\\"')
BSMAP.set("\0", "\\0")
BSMAP.set("\\", "\\\\")
BSMAP.set("\b", "\\b")
BSMAP.set("\f", "\\f")
BSMAP.set("\n", "\\n")
BSMAP.set("\r", "\\r")
BSMAP.set("\t", "\\t")
BSMAP.set("\v", "\\v")

function quote(unquoted: string): string {
    let ret = '"'
    for (const ch of unquoted) {
        let bsmapped = BSMAP.get(ch)
        if (bsmapped) {
            ret += bsmapped
        } else if (ch.match(/[\p{L}\p{M}\p{N}\p{P}\p{S} ]/u)) {
            ret += ch
        } else {
            ret += "\\u{" + ch.codePointAt(0).toString(16) + "}"
        }
    }
    ret += '"'
    return ret
}

function lcIfWin(str: string): string {
    const IS_WINDOWS = os.type().toLowerCase().startsWith("windows")
    return IS_WINDOWS ? str.toLowerCase() : str
}

/* main program */

/* process our arguments */
try {
    var { values, positionals } = util.parseArgs({
        'options': {
            'appname': { type: 'string', short: 'a', default: DEFAULT_NAME },
            'help': { type: 'boolean', short: 'h', default: false },
            'route': { type: 'string', short: 'r', default: ROUTES_DIR },
            'prefix': { type: 'string', short: 'p', default: "" }
        }
    });
} catch (e) {
    process.stderr.write(`${MYNAME}: syntax error - ${e.message}\n`)
    process.exit(1)
}

if (values.help) {
    console.log(`--appname -a   Name of script to generate (default ${DEFAULT_NAME}).`)
    console.log(`--help -h      Print this help message.`)
    console.log(`--prefix -p    Route prefix (default none).`)
    console.log(`--route -r     Directory to define routes from (default ${ROUTES_DIR}).`)
    process.exit(0)
}

/* generate output
   xxx - we blindly assume the head and tail files are UTF8 */
const output = fs.openSync(values.appname + JS_EXT, "w")
fs.writeFileSync(output, `/* Created by appgen. DO NOT EDIT THIS FILE. */\n
const express = require('express');
const app = express();
const port = 3000;
app.use(express.static(${quote(STATIC_DIR)}));\n
/* header */\n\n`, WRITE_OPTS)
const header = values.appname + HEAD_SUFF + JS_EXT
if (fs.existsSync(header)) {
    fs.writeFileSync(output, fs.readFileSync(header))
}
fs.writeFileSync(output, "\n/* generated routes */\n\n", WRITE_OPTS)
makeRoutes(values.route)
fs.writeFileSync(output, "\n/* trailer */\n\n", WRITE_OPTS)
const trailer = values.appname + TAIL_SUFF + JS_EXT
if (fs.existsSync(trailer)) {
    fs.writeFileSync(output, fs.readFileSync(trailer))
}
fs.writeFileSync(output, `
/* listen */

app.listen(port, () => {
  console.log(\`Listening on port \${port}...\`)
});\n`)

/* AMF */
fs.closeSync(output)
