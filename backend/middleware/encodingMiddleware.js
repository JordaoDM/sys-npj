const encodingMiddleware = (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  const charFixMap = {
    'Ã§': 'ç', 'Ã£': 'ã', 'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã¢': 'â', 'Ãª': 'ê', 'Ã´': 'ô', 'Ã ': 'à', 'Ã¨': 'è', 'Ã¬': 'ì', 'Ã²': 'ò',
    'Ã¹': 'ù', 'Ã…': 'Å', 'Ã‡': 'Ç', 'Â°': '°', 'â€™': '’', 'â€': '”', 'â€œ': '“'
  };
  
  function fixEncoding(obj, visited = new WeakSet()) {
    if (obj && typeof obj === 'object' && visited.has(obj)) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      let fixed = obj;
      for (const [wrong, correct] of Object.entries(charFixMap)) {
        fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
      }

      const normalized = fixed
        .replace(/Ã([\u0080-\u00BF])/g, (match, c) => String.fromCharCode(c.charCodeAt(0)))
        .replace(/Â/g, '');

      return normalized;
    }
    
    if (Array.isArray(obj)) {
      visited.add(obj);
      return obj.map(item => fixEncoding(item, visited));
    }
    
    if (obj && typeof obj === 'object') {
      visited.add(obj);
      const fixed = {};
      for (const [key, value] of Object.entries(obj)) {
        try {
          fixed[key] = fixEncoding(value, visited);
        } catch (error) {
          fixed[key] = value;
        }
      }
      return fixed;
    }
    
    return obj;
  }
  
  const originalJson = res.json;
  res.json = function(data) {
    const fixedData = fixEncoding(data);
    return originalJson.call(this, fixedData);
  };
  
  if (req.body) {
    req.body = fixEncoding(req.body);
  }
  
  next();
};

module.exports = encodingMiddleware;
