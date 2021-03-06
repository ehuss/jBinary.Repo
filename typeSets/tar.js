define(['jbinary'], function (jBinary) {
	return {
		'jBinary.all': 'File',
		'jBinary.mimeType': 'application/x-tar',

		OctValue: jBinary.Template({
			params: ['size'],
			setParams: function (size) {
				this.baseType = ['string0', size];
			},
			read: function () {
				return parseInt(this.baseRead(), 8);
			},
			write: function (value) {
				value = value.toString(8);
				value = Array(this.size - value.length).join('0') + value;
				this.baseWrite(value);
			}
		}),

		Oct8: ['OctValue', 8],

		Oct12: ['OctValue', 12],

		Padding: ['skip', function () {
			return (512 - (this.binary.tell() % 512)) % 512;
		}],

		FileItem: ['extend',
		{
			name: ['string0', 100],
			mode: 'Oct8',
			owner: 'Oct8',
			group: 'Oct8',
			size: jBinary.Template({
				baseType: 'Oct12',
				write: function (context) {
					this.baseWrite(context.content_binary.view.byteLength);
				}
			}),
			mod_time: jBinary.Template({
				baseType: 'Oct12',
				read: function () {
					return new Date(this.baseRead() * 1000);
				},
				write: function (dateTime) {
					this.baseWrite(dateTime / 1000);
				}
			}),
			checksum: 'Oct8',
			type: ['enum', 'char', {
				'0': 'file',
				'1': 'hard',
				'2': 'symbolic',
				'3': 'device_char',
				'4': 'device_block',
				'5': 'directory',
				'6': 'pipe',
				'7': 'contiguous'
			}],
			name_linked: ['string0', 100],
			_ustar: ['const', ['string', 8], 'ustar\x0000']
		},
		['if', function (context) { return context._ustar === undefined || context._ustar === 'ustar\x0000' }, {
			owner_name: ['string0', 32],
			group_name: ['string0', 32],
			device: ['array', 'Oct8', 2],
			name_prefix: ['string0', 155]
		}],
		{
			_padding1: 'Padding',
			content: ['binary', function () { return this.binary.getContext(1).size }],
			_padding2: 'Padding'
		}
		],

		File: jBinary.Template({
			baseType: ['array', 'FileItem'],
			read: function () {
				var items = [], view = this.binary.view, item;
				while (view.tell() < view.byteLength && !isNaN((item = this.binary.read('FileItem')).size)) {
					items.push(item);
				}
				return items;
			}
		})
	};
});