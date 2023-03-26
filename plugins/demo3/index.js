const { PupPlugin, segment, parseDmMessageId } = require('@pupbot/core')
//额外引入segment工具(对象)
const plugin = new PupPlugin('demo3', '1.0.0')
plugin.onMounted(() => {
    // var oss = {
    //     accessKeyId: 'LTAI5tL5jxvXbBU2NLg75kS8',
    //     accessKeySecret: '2ldxYEoLWQYoJd9YmyrrfZbdkR7zyT',
    //     bucketName: 'olrando',
    //     region: 'oss-cn-chengdu'
    // };
    // // 创建一个OSS客户端对象，并使用上述访问密钥进行身份验证。
    // var client = new OSS({
    //     accessKeyId: oss.accessKeyId,
    //     accessKeySecret: oss.accessKeySecret,
    //     bucket: oss.bucketName,
    //     region: oss.region
    // });
    // plugin.onCmd('/course', (event, params) => {
    //     const [cmd, value] = params
    //     if (cmd === 'bind') {

    //     }
    // })
    // 绑定课表

    // 发送课表
    plugin.on('message', (event) => {
        // console.log('hhh');
        // event.reply(event.raw_message)
        if (event.raw_message === '发课表') {
            const str = '你的课程表为：'
            const img = 'https://olrando.oss-cn-chengdu.aliyuncs.com/img/scourse.png'
            event.reply([str, segment.image(img)])

            //调用segment对象的image()方法，构建图片数据,可传入链接，图片file等。

            //这里event.reply的参数是一个消息数组(字符串和图片)，不能通过“+”连接一起发送，这里规定使用数组将两者拼接发送。

        }
    })
})
module.exports = { plugin }
