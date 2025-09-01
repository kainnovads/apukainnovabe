import type { HttpContext } from '@adonisjs/core/http'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import Product from '#models/product'
import Stock from '#models/stock'
import Unit from '#models/unit'
import Category from '#models/category'
import Warehouse from '#models/warehouse'
import db from '@adonisjs/lucid/services/db'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'

export default class ImportController {

  async importProductsAndStocks({ request, response }: HttpContext) {
    try {
      const file = request.file('excel_file')
      
      if (!file || !(file instanceof MultipartFile)) {
        return response.badRequest({
          message: 'File Excel tidak ditemukan',
          errors: {
            excel_file: ['File Excel harus diupload']
          }
        })
      }

      // Validasi file Excel
      const fileType = file.type || ''
      const fileExtension = file.clientName?.split('.').pop()?.toLowerCase() || ''

      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]

      const allowedExtensions = ['xlsx', 'xls']

      const isValidMimeType = allowedMimeTypes.includes(fileType)
      const isValidExtension = allowedExtensions.includes(fileExtension)

      if (!isValidMimeType && !isValidExtension) {
        return response.badRequest({
          message: 'File harus berupa Excel (.xlsx atau .xls)',
          errors: {
            excel_file: ['File harus berupa Excel (.xlsx atau .xls)']
          }
        })
      }

      // Validasi file size (10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return response.badRequest({
          message: 'Ukuran file terlalu besar (maksimal 10MB)',
          errors: {
            excel_file: ['Ukuran file terlalu besar (maksimal 10MB)']
          }
        })
      }

      // Baca file Excel
      const buffer = readFileSync(file.tmpPath!)
      const workbook = XLSX.read(buffer, { type: 'buffer' })

      // Ambil sheet Products dan Stocks
      const productsSheet = workbook.Sheets['Products']
      const stocksSheet = workbook.Sheets['Stocks']

      if (!productsSheet) {
        return response.badRequest({
          message: 'Sheet "Products" tidak ditemukan dalam file Excel',
          errors: {
            excel_file: ['Sheet "Products" tidak ditemukan dalam file Excel']
          }
        })
      }

      if (!stocksSheet) {
        return response.badRequest({
          message: 'Sheet "Stocks" tidak ditemukan dalam file Excel',
          errors: {
            excel_file: ['Sheet "Stocks" tidak ditemukan dalam file Excel']
          }
        })
      }

      // Convert sheet ke JSON
      const productsData = XLSX.utils.sheet_to_json(productsSheet, { header: 1 })
      const stocksData = XLSX.utils.sheet_to_json(stocksSheet, { header: 1 })

      // Validasi header
      const productsHeaders = productsData[0] as string[]
      const stocksHeaders = stocksData[0] as string[]

      const requiredProductHeaders = [
        'SKU', 'No Interchange', 'Nama Product', 'Unit', 'Kategori', 
        'Stok Minimum', 'Harga Beli', 'Harga Jual', 'Is Service', 
        'Kondisi', 'Berat'
      ]

      const requiredStockHeaders = [
        'SKU Product', 'Kode Gudang', 'Quantity'
      ]

      // Validasi header Products
      const missingProductHeaders = requiredProductHeaders.filter(
        header => !productsHeaders.includes(header)
      )

      if (missingProductHeaders.length > 0) {
        return response.badRequest({
          message: `Header yang diperlukan pada sheet Products: ${missingProductHeaders.join(', ')}`,
          errors: {
            excel_file: [`Header yang diperlukan pada sheet Products: ${missingProductHeaders.join(', ')}`]
          }
        })
      }

      // Validasi header Stocks
      const missingStockHeaders = requiredStockHeaders.filter(
        header => !stocksHeaders.includes(header)
      )

      if (missingStockHeaders.length > 0) {
        return response.badRequest({
          message: `Header yang diperlukan pada sheet Stocks: ${missingStockHeaders.join(', ')}`,
          errors: {
            excel_file: [`Header yang diperlukan pada sheet Stocks: ${missingStockHeaders.join(', ')}`]
          }
        })
      }

      // Ambil data tanpa header
      const productsRows = productsData.slice(1) as any[][]
      const stocksRows = stocksData.slice(1) as any[][]

      // Validasi data tidak kosong
      if (productsRows.length === 0) {
        return response.badRequest({
          message: 'Data Products tidak boleh kosong',
          errors: {
            excel_file: ['Data Products tidak boleh kosong']
          }
        })
      }

      // Mulai transaction
      const trx = await db.transaction()

      try {
        const results = {
          products: {
            success: 0,
            failed: 0,
            errors: [] as any[]
          },
          stocks: {
            success: 0,
            failed: 0,
            errors: [] as any[]
          }
        }

        // Cache untuk unit, kategori, dan warehouse
        const unitCache = new Map<string, number>()
        const categoryCache = new Map<string, number>()
        const warehouseCache = new Map<string, number>()
        const productCache = new Map<string, number>()
        
        // Cache untuk SKU dan No Interchange yang sudah di-generate dalam batch ini
        const generatedSkuCache = new Set<string>()
        const generatedInterchangeCache = new Set<string>()
        
        // Counter untuk generate SKU dan No Interchange otomatis
        let unknownSkuCounter = 1
        let unknownInterchangeCounter = 1

        // Load cache
        const units = await Unit.all()
        const categories = await Category.all()
        const warehouses = await Warehouse.all()

        units.forEach(unit => {
          unitCache.set(unit.name.toLowerCase(), unit.id)
        })

        categories.forEach(category => {
          categoryCache.set(category.name.toLowerCase(), category.id)
        })

        warehouses.forEach(warehouse => {
          warehouseCache.set(warehouse.code.toLowerCase(), warehouse.id)
        })

        // Pastikan kategori 'unknown' tersedia
        let unknownCategoryId = categoryCache.get('unknown')
        if (!unknownCategoryId) {
          const unknownCategory = await Category.create({
            name: 'unknown',
            description: 'Kategori default untuk produk tanpa kategori'
          }, { client: trx })
          unknownCategoryId = unknownCategory.id
          categoryCache.set('unknown', unknownCategoryId)
        }

        // Pastikan warehouse 'APU 01' tersedia
        let apuWarehouseId = warehouseCache.get('apu 01')
        if (!apuWarehouseId) {
          const apuWarehouse = await Warehouse.create({
            code: 'APU 01',
            name: 'Warehouse APU 01',
            address: 'Alamat Warehouse APU 01',
            phone: '-',
            email: '-',
            isActive: true
          }, { client: trx })
          apuWarehouseId = apuWarehouse.id
          warehouseCache.set('apu 01', apuWarehouseId)
        }

        // Debug: Log available data
        console.log('Available Units:', units.map(u => u.name))
        console.log('Available Categories:', categories.map(c => c.name))
        console.log('Available Warehouses:', warehouses.map(w => w.code))

        // Proses Products
        for (let i = 0; i < productsRows.length; i++) {
          const row = productsRows[i]
          const rowNumber = i + 2 // +2 karena index 0 dan header

          try {
            const [
              sku, noInterchange, name, unitName, categoryName, 
              stockMin, priceBuy, priceSell, isService, kondisi, berat
            ] = row

            // Validasi data wajib
            if (!unitName) {
              results.products.errors.push({
                row: rowNumber,
                message: 'Unit wajib diisi'
              })
              results.products.failed++
              continue
            }

            // Fallback untuk field yang kosong
            let finalSku = sku ? sku.toString() : 'unknown'
            let finalNoInterchange = noInterchange ? noInterchange.toString() : 'unknown'
            const finalName = name ? name.toString().toUpperCase() : 'unknown'
            const finalCategoryName = categoryName ? categoryName.toString() : 'unknown'
            
            // Generate SKU otomatis jika kosong atau duplikat
            if (!sku || finalSku === 'unknown') {
              // Cari SKU yang unik
              let generatedSku = `unknown${unknownSkuCounter.toString().padStart(2, '0')}`
              while (productCache.has(generatedSku) || generatedSkuCache.has(generatedSku) || await Product.findBy('sku', generatedSku)) {
                unknownSkuCounter++
                generatedSku = `unknown${unknownSkuCounter.toString().padStart(2, '0')}`
              }
              finalSku = generatedSku
              generatedSkuCache.add(generatedSku)
              unknownSkuCounter++
            } else {
              // Jika SKU sudah ada di database atau cache, generate SKU baru
              const existingProduct = await Product.findBy('sku', finalSku)
              if (existingProduct || generatedSkuCache.has(finalSku)) {
                // Generate SKU baru untuk menghindari duplikasi
                let generatedSku = `unknown${unknownSkuCounter.toString().padStart(2, '0')}`
                while (productCache.has(generatedSku) || generatedSkuCache.has(generatedSku) || await Product.findBy('sku', generatedSku)) {
                  unknownSkuCounter++
                  generatedSku = `unknown${unknownSkuCounter.toString().padStart(2, '0')}`
                }
                finalSku = generatedSku
                generatedSkuCache.add(generatedSku)
                unknownSkuCounter++
              } else {
                // SKU unik, tambahkan ke cache
                generatedSkuCache.add(finalSku)
              }
            }

            // Generate No Interchange otomatis jika kosong atau duplikat
            if (!noInterchange || finalNoInterchange === 'unknown') {
              // Cari No Interchange yang unik
              let generatedInterchange = `INT${unknownInterchangeCounter.toString().padStart(3, '0')}`
              while (generatedInterchangeCache.has(generatedInterchange) || await Product.findBy('noInterchange', generatedInterchange)) {
                unknownInterchangeCounter++
                generatedInterchange = `INT${unknownInterchangeCounter.toString().padStart(3, '0')}`
              }
              finalNoInterchange = generatedInterchange
              generatedInterchangeCache.add(generatedInterchange)
              unknownInterchangeCounter++
            } else {
              // Jika No Interchange sudah ada di database atau cache, generate yang baru
              const existingProductByInterchange = await Product.findBy('noInterchange', finalNoInterchange)
              if (existingProductByInterchange || generatedInterchangeCache.has(finalNoInterchange)) {
                // Generate No Interchange baru untuk menghindari duplikasi
                let generatedInterchange = `INT${unknownInterchangeCounter.toString().padStart(3, '0')}`
                while (generatedInterchangeCache.has(generatedInterchange) || await Product.findBy('noInterchange', generatedInterchange)) {
                  unknownInterchangeCounter++
                  generatedInterchange = `INT${unknownInterchangeCounter.toString().padStart(3, '0')}`
                }
                finalNoInterchange = generatedInterchange
                generatedInterchangeCache.add(generatedInterchange)
                unknownInterchangeCounter++
              } else {
                // No Interchange unik, tambahkan ke cache
                generatedInterchangeCache.add(finalNoInterchange)
              }
            }

            // Debug: Log SKU dan No Interchange yang akan digunakan
            console.log(`Row ${rowNumber}: SKU=${finalSku}, NoInterchange=${finalNoInterchange}`)
            
            // SKU sudah di-generate otomatis dan unik, tidak perlu cek duplikasi lagi

            // Validasi unit
            const unitId = unitCache.get(unitName.toLowerCase())
            if (!unitId) {
              results.products.errors.push({
                row: rowNumber,
                message: `Unit "${unitName}" tidak ditemukan dalam database`
              })
              results.products.failed++
              continue
            }

            // Validasi kategori
            let categoryId = categoryCache.get(finalCategoryName.toLowerCase())
            if (!categoryId) {
              // Gunakan kategori 'unknown' sebagai fallback
              categoryId = categoryCache.get('unknown')
              if (!categoryId) {
                results.products.errors.push({
                  row: rowNumber,
                  message: `Kategori "${finalCategoryName}" tidak ditemukan dan kategori 'unknown' tidak tersedia`
                })
                results.products.failed++
                continue
              }
            }

            // Validasi kondisi
            const validConditions = ['baru', 'bekas', 'rusak', 'servis']
            if (kondisi && !validConditions.includes(kondisi.toLowerCase())) {
              results.products.errors.push({
                row: rowNumber,
                message: `Kondisi "${kondisi}" tidak valid. Harus salah satu dari: ${validConditions.join(', ')}`
              })
              results.products.failed++
              continue
            }

            // Buat product
            const product = await Product.create({
              sku: finalSku,
              noInterchange: finalNoInterchange,
              name: finalName,
              unitId: unitId,
              categoryId: categoryId,
              stockMin: stockMin ? Number(stockMin) : 0,
              priceBuy: priceBuy ? Number(priceBuy) : 0,
              priceSell: priceSell ? Number(priceSell) : 0,
              isService: isService ? Boolean(isService) : false,
              kondisi: kondisi ? kondisi.toLowerCase() : 'baru',
              berat: berat ? Number(berat) : 0,
              image: ''
            }, { client: trx })

            productCache.set(finalSku, product.id)
            results.products.success++

          } catch (error) {
            // Log error untuk debugging
            console.error(`Error pada row ${rowNumber}:`, error.message)
            
            results.products.errors.push({
              row: rowNumber,
              message: error.message
            })
            results.products.failed++
            
            // Jika ada error duplikasi, rollback transaction dan stop import
            if (error.message.includes('duplicate key value violates unique constraint')) {
              console.error('Detected duplicate key error, rolling back transaction')
              await trx.rollback()
              return response.status(422).json({
                message: 'Import gagal karena ada duplikasi data',
                results: results
              })
            }
          }
        }

        // Proses Stocks
        for (let i = 0; i < stocksRows.length; i++) {
          const row = stocksRows[i]
          const rowNumber = i + 2 // +2 karena index 0 dan header

          try {
            const [sku, warehouseCode, quantity] = row

            // Debug: Log data yang masuk
            console.log(`Row ${rowNumber}: SKU="${sku}", Warehouse="${warehouseCode}", Quantity="${quantity}"`)
            
            // Skip baris kosong (semua field kosong atau hanya whitespace)
            const isEmptyRow = (!sku || sku.toString().trim() === '') && 
                              (!warehouseCode || warehouseCode.toString().trim() === '') && 
                              (quantity === undefined || quantity === null || quantity === '' || quantity.toString().trim() === '')
            
            if (isEmptyRow) {
              console.log(`Row ${rowNumber}: Skipping empty row`)
              continue
            }

            // Validasi data wajib dengan penanganan whitespace
            const cleanSku = sku ? sku.toString().trim() : ''
            const cleanWarehouseCode = warehouseCode ? warehouseCode.toString().trim() : ''
            
            if (!cleanSku || !cleanWarehouseCode) {
              results.stocks.errors.push({
                row: rowNumber,
                message: 'SKU Product dan Kode Gudang wajib diisi'
              })
              results.stocks.failed++
              continue
            }

            // Set quantity default jika kosong
            const finalQuantity = (quantity === undefined || quantity === null || quantity === '') ? 0 : quantity

            // Cari product berdasarkan SKU asli atau SKU yang sudah di-generate
            let productId = productCache.get(cleanSku)
            
            // Jika tidak ditemukan di cache, coba cari di database
            if (!productId) {
              const product = await Product.findBy('sku', cleanSku)
              if (product) {
                productId = product.id
                productCache.set(cleanSku, productId)
              }
            }
            
            if (!productId) {
              results.stocks.errors.push({
                row: rowNumber,
                message: `Product dengan SKU "${cleanSku}" tidak ditemukan dalam sheet Products atau database`
              })
              results.stocks.failed++
              continue
            }

            // Validasi warehouse
            let warehouseId = warehouseCache.get(cleanWarehouseCode.toLowerCase())
            if (!warehouseId) {
              // Gunakan warehouse 'APU 01' sebagai fallback
              warehouseId = warehouseCache.get('apu 01')
              if (!warehouseId) {
                results.stocks.errors.push({
                  row: rowNumber,
                  message: `Warehouse dengan kode "${cleanWarehouseCode}" tidak ditemukan dan warehouse 'APU 01' tidak tersedia`
                })
                results.stocks.failed++
                continue
              }
            }

            // Validasi quantity
            const qty = Number(finalQuantity)
            if (isNaN(qty) || qty < 0) {
              results.stocks.errors.push({
                row: rowNumber,
                message: `Quantity harus berupa angka positif`
              })
              results.stocks.failed++
              continue
            }

            // Cek apakah stock sudah ada
            const existingStock = await Stock.query()
              .where('product_id', productId)
              .where('warehouse_id', warehouseId)
              .first()

            if (existingStock) {
              // Update quantity
              existingStock.quantity += qty
              await existingStock.save()
            } else {
              // Buat stock baru
              await Stock.create({
                productId: productId,
                warehouseId: warehouseId,
                quantity: qty,
                description: `Import dari Excel - ${new Date().toISOString()}`
              }, { client: trx })
            }

            results.stocks.success++

          } catch (error) {
            results.stocks.errors.push({
              row: rowNumber,
              message: error.message
            })
            results.stocks.failed++
          }
        }

        // Commit transaction jika semua berhasil
        await trx.commit()

        // Cek apakah ada error
        const hasErrors = results.products.failed > 0 || results.stocks.failed > 0
        
        if (hasErrors) {
          return response.status(422).json({
            message: 'Import selesai dengan beberapa error',
            results: results
          })
        }

        return response.ok({
          message: 'Import berhasil diproses',
          results: results
        })

      } catch (error) {
        await trx.rollback()
        throw error
      }

    } catch (error) {
      console.error('Import error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat import data',
        error: error.message
      })
    }
  }

  async downloadTemplate({ response }: HttpContext) {
    try {
      // Buat workbook baru
      const workbook = XLSX.utils.book_new()

      // Data untuk sheet Products
      const productsData = [
        [
          'SKU', 'No Interchange', 'Nama Product', 'Unit', 'Kategori', 
          'Stok Minimum', 'Harga Beli', 'Harga Jual', 'Is Service', 
          'Kondisi', 'Berat'
        ],
        // Contoh data dengan fallback: SKU kosong akan di-generate otomatis (unknown01, unknown02, dst), No Interchange kosong akan di-generate otomatis (INT001, INT002, dst), Nama Product kosong akan diisi 'unknown', Kategori kosong akan diisi 'unknown', Warehouse tidak ditemukan akan menggunakan 'APU 01', Quantity kosong akan diisi 0
        [
          'PRD001', 'INT001', 'LAPTOP ASUS ROG', 'PCS', 'Komputer',
          10, 15000000, 18000000, false, 'baru', 2.5
        ],
        [
          'PRD002', 'INT002', 'MOUSE GAMING', 'PCS', 'Komputer',
          20, 500000, 750000, false, 'baru', 0.2
        ],
        [
          'PRD003', 'INT003', 'KEYBOARD MECHANICAL', 'PCS', 'Komputer',
          15, 800000, 1200000, false, 'baru', 0.8
        ],
        [
          '', 'INT004', '', 'PCS', '',
          5, 100000, 150000, false, 'baru', 0.1
        ],
        [
          'PRD005', 'INT005', '', 'PCS', 'Elektronik',
          8, 200000, 300000, false, 'baru', 0.3
        ],
        [
          'PRD006', '', 'PRODUCT TANPA INTERCHANGE', 'PCS', 'Elektronik',
          12, 250000, 350000, false, 'baru', 0.5
        ]
      ]

      // Data untuk sheet Stocks
      const stocksData = [
        ['SKU Product', 'Kode Gudang', 'Quantity'],
        ['PRD001', 'WH001', 50],
        ['PRD002', 'WH001', 100],
        ['PRD001', 'WH002', 25],
        ['PRD003', 'WH001', 75],
        ['PRD002', 'WH002', 30],
        ['PRD004', 'APU 01', 40],
        ['PRD005', 'WAREHOUSE_TIDAK_ADA', 60],
        ['PRD006', 'WH001', ''],
        ['PRD007', 'WH002', 0]
      ]

      // Buat worksheet
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
      const stocksSheet = XLSX.utils.aoa_to_sheet(stocksData)

      // Tambahkan worksheet ke workbook
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products')
      XLSX.utils.book_append_sheet(workbook, stocksSheet, 'Stocks')

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      // Set response headers
      response.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      response.header('Content-Disposition', 'attachment; filename="template_import_product_stock.xlsx"')

      return response.send(buffer)

    } catch (error) {
      console.error('Template download error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengunduh template',
        error: error.message
      })
    }
  }
}
