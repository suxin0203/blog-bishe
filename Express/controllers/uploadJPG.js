const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const getPublicBaseUrl = (req) => {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host') || '';
  return host ? `${protocol}://${host}` : '';
};

// 获取当前日期，格式为YYYYMMDD
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 富文本编辑器上传
exports.richEditorUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(200).json({
        errno: 1,
        message: '上传失败',
      });
    }
    const ret_files = [];
    for (const file of req.files) {
      const fileName = file.originalname;
      const fileExt = path.extname(fileName);
      const currentDate = getCurrentDate();
      const file_name = `${currentDate}/${uuidv4()}${fileExt}`;
      // 创建子文件夹（如果不存在）
      const uploadFolderPath = path.join(process.cwd(), '/public/upload/', currentDate);
      if (!fs.existsSync(uploadFolderPath)) {
        fs.mkdirSync(uploadFolderPath);
      }
      // 移动文件到子文件夹
      fs.renameSync(
        path.join(process.cwd(), '/public/upload/Filerelay/', file.filename),
        path.join(process.cwd(), '/public/upload/', file_name)
      );
      ret_files.push(`/upload/${file_name}`);
    }
    res.status(200).json({
      errno: 0,
      code: 200,
      data: {
        url: ret_files[0], // 图片 src ，必须
        alt: '这是似乎是一张图片', // 图片名称，非必须
        href: `${getPublicBaseUrl(req)}${ret_files[0]}`, // 图片的链接，非必须
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errno: 1,
      code: 500,
      message: '上传失败',
    });
  }
};


// 轮播图上传
exports.lbtUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    res.send({
      "errno": 1, // 只要不等于 0 就行
      "message": "上传失败"
    })
    return;
  }
  let files = req.files;
  let ret_files = [];
  for (let file of files) {
    let file_ext = file.originalname.substring(file.originalname.lastIndexOf(".") + 1)
    //上传文件随机名字
    let file_name = uuidv4() + "." + file_ext
    //修改名字+移动文件
    fs.renameSync(
      process.cwd() + "/public/upload/Filerelay/" + file.filename,
      process.cwd() + "/public/upload/lbt/" + file_name,
    )
    ret_files.push(`/upload/lbt/${file_name}`)
  }
  res.send(
    {
      "errno": 0, // 注意：值是数字，不能是字符串
      "isShow": true,
      "data": {
        "url": ret_files[0], // 图片 src，统一相对路径（与富文本上传一致），前端渲染时再拼接域名
        "href": `${getPublicBaseUrl(req)}${ret_files[0]}` // 图片的链接，非必须
      }
    }
  )
};


// 获取图片列表
exports.getImageList = (req, res) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const images = [];

  fs.readdir(path.join(process.cwd(), 'public', 'upload', 'lbt'), (err, files) => {
    if (err) {

      res.status(500).json({ error: '读取文件失败' });
    } else {
      files.forEach((file) => {
        const fileExt = path.extname(file);
        if (imageExtensions.includes(fileExt.toLowerCase())) {
          const fileName = file.substring(0, file.lastIndexOf('.'));
          // 统一返回相对路径，避免返回值随部署域名/端口变化
          const fileUrl = `/upload/lbt/${file}`;

          images.push({
            id: fileName,
            name: file,
            href: fileUrl,
            url: fileUrl,
            isShow: true,
            status: "finished",
          });
        }
      });

      res.status(200).json({ code: 200, message: "获取成功", data: images });
    }
  });
};

// 删除图片
exports.deleteImage = (req, res) => {
  const image = req.query.image;
  const imagePath = path.join(process.cwd(), 'public', 'upload', 'lbt', image);

  fs.unlink(imagePath, (err) => {
    if (err) {
      res.status(500).json({ code: 500, message: '删除文件失败' });
    } else {
      res.status(200).json({ code: 200, message: '删除成功' });
    }
  });
};

