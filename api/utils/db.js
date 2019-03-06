const pgRead = require.main.require('./db').pgRead;
const pgWrite = require.main.require('./db').pgWrite;
const settings = require.main.require('./settings');
const utils = require('./utils.js');
const key = settings.db.crypto.key;

/**
 * Decrypt message using default key
 * @param {String} txt Message to decrypt
 * @return {String} decrypted message
 */
exports.decrypt = function(txt) {
  var sqlDecrypt = "SELECT mx_decrypt('" + txt + "','" + key + "') as msg";
  return pgRead.query(sqlDecrypt).then(function(result) {
    if (result.rowCount > 0) {
      return JSON.parse(result.rows[0].msg);
    } else {
      return {};
    }
  });
};

/**
 * Register a source in mx_sources
 * @param {String} idSource Id of the source
 * @param {Integer} idUser Id of the user
 * @param {String} idProject Id of the project
 * @param {String} title English title
 * @return {Boolean} inserted
 */
exports.registerSource = registerSource;

function registerSource(idSource, idUser, idProject, title) {
  var options = {};

  if (typeof idSource == 'object') {
    options = idSource;
    idSource = options.idSource;
    idUser = options.idUser * 1;
    idProject = options.idProject;
    title = options.sourceTitle || options.layerTitle || options.title;
  }

  var sqlAddSource = `INSERT INTO mx_sources (
    id, editor, readers, editors, date_modified, type, project, data
  ) VALUES (
    $1::text,
    $2::integer,
    '["publishers"]',
    '["publishers"]',
    now(),
    'vector',
    $3::text,
    '{"meta":{"text":{"title":{"en":"${title}"}}}}' 
  )`;

  return pgWrite
    .query(sqlAddSource, [idSource, idUser, idProject])
    .then((res) => {
      return true;
    });
}

/**
 * Test empty table : if no records, remove table, else register it as source
 * @param {String|Object} idSource id of the layer to add, or object with idSource, idUser, idProject, title.
 */
exports.registerOrRemoveSource = function(idSource, idUser, idProject, title) {
  if (typeof idSource == 'object') {
    options = idSource;
    idSource = options.idSource;
    idUser = options.idUser * 1;
    idProject = options.idProject;
    title = options.sourceTitle || options.layerTitle || options.title;
  }

  var sqlCountRow = {
    text: `SELECT count(*) n FROM ${idSource}`
  };

  return pgRead
    .query(sqlCountRow)
    .then((r) => {
      var count = r.rowCount > 0 ? r.rows[0].n * 1 : 0;
      if (count === 0) {
        return removeSource(idSource).then(() => {
          return {removed: true};
        });
      } else {
        return Promise.resolve({removed: false});
      }
    })
    .then((res) => {
      if (res.removed === true) {
        return Promise.resolve({registered: false});
      } else {
        return registerSource(idSource, idUser, idProject, title).then(() => {
          return {registered: true};
        });
      }
    });
};

/**
 * Remove source
 * @param {String} idSource Source to remove
 */
function removeSource(idSource) {
  var sqlDelete = {
    text: `DELETE FROM mx_sources WHERE id = $1::text`,
    values: [idSource]
  };
  var sqlDrop = {
    text: `DROP TABLE IF EXISTS ${idSource}`
  };
  console.log('Remove source entry in mx_sources for ' + idSource);
  return pgWrite.query(sqlDrop).then(() => {
    console.log('Remove table ' + idSource);
    return pgWrite.query(sqlDelete);
  });
}
exports.removeSource = removeSource;

/**
 * Get layer columns names
 * @param {String} id of the layer
 */
exports.getColumnsNames = function(idLayer) {
  var queryAttributes = {
    text: `SELECT column_name AS names 
    FROM information_schema.columns 
    WHERE table_name=$1`,
    values: [idLayer]
  };
  return pgRead.query(queryAttributes).then((r) => {
    return r.rows.map((a) => a.names);
  });
};

/**
 * Get layer title
 * @param {String} id of the layer
 */
function getLayerTitle(idLayer, language) {
  language = language || 'en';
  var queryAttributes = {
    text: `SELECT data#>>'{"meta","text","title","${language}"}' AS title 
    FROM mx_sources
    WHERE id=$1`,
    values: [idLayer]
  };
  return pgRead.query(queryAttributes).then((r) => {
    return r.rows[0].title;
  });
}
exports.getLayerTitle = getLayerTitle;

/**
 * Check for layer geom validity
 * @param {String} idLayer id of the layer to check
 * @param {Boolean} useCache Use cache
 * @param {Boolean} autoCorrect Try an automatic correction
 */
function isLayerValid(idLayer, useCache, autoCorrect) {
  var title = '';
  var idColumn = '_mx_valid';
  useCache = utils.toBoolean(useCache,true);
  autCorrect = utils.toBoolean(autoCorrect,false);  

  var sqlNewColumn = `
  ALTER TABLE ${idLayer} 
  ADD COLUMN IF NOT EXISTS ${idColumn} BOOLEAN
  DEFAULT null
  `;

  var sqlValidate = `
  UPDATE ${idLayer} 
  SET ${idColumn} = ST_IsValid(geom)`;

  var sqlAutoCorrect = `
  UPDATE ${idLayer}
  SET geom = 
    CASE
      WHEN GeometryType(geom) ~* 'POLYGON'
      THEN ST_Multi(ST_Buffer(geom,0))
      ELSE ST_MakeValid(geom)
    END
  WHERE 
    NOT ST_isValid(geom)
  `;

  if (useCache) {
    /**
     * If use cache, don't evaluate where validity
     * is true or false. Evaluate where validity is
     * null only
     */
    sqlValidate =
      sqlValidate +
      `
    WHERE ${idColumn} is null
    `;
  }

  var sqlValidityStatus = `
  SELECT count(${idColumn}) as n, ${idColumn} as valid
  FROM  ${idLayer}
  GROUP BY ${idColumn}`;

  return getLayerTitle(idLayer)
    .then((t) => {
      title = t;
      return pgWrite.query(sqlNewColumn);
    })
    .then(() => {
      if(autoCorrect){
        return pgWrite.query(sqlAutoCorrect);
      }else{
        return Promise.resolve();
      }
    })
    .then(() => {
      return pgWrite.query(sqlValidate);
    })

    .then(() => {
      return pgRead.query(sqlValidityStatus);
    })
    .then((res) => {
      var out = {
        nValid: 0,
        nInvalid: 0
      };

      res.rows.forEach((r) => {
        var n = r.n ? r.n * 1 || 0 : 0;
        switch (r.valid) {
          case true:
            out.nValid = n;
            break;
          case false:
            out.nInvalid = n;
            break;
        }
      });

      return {
        id: idLayer,
        valid: out.nInvalid == 0,
        title: title,
        status: out,
        useCache: useCache,
        autoCorrect : autoCorrect
      };
    });

}
exports.isLayerValid = isLayerValid;

/**
 * Check for multiple layer geom validity
 * @param {Array} idsLayer Array of id of layer to check
 * @param {Boolean} force Force revalidation of previously wrong geom
 */
exports.areLayersValid = function(idsLayers, force) {
  force = force || false;
  idsLayers = idsLayers instanceof Array ? idsLayers : [idsLayers];
  var queries = idsLayers.map(isLayerValid, force);
  return Promise.all(queries);
};